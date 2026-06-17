// Endpoint de classificação por IA — recebe um pedidoId e:
//   1. Busca o pedido com o tenant e a tabela de preços
//   2. Chama o Claude para classificar, estimar urgência e gerar resposta em francês
//   3. Atualiza o pedido na BD com os resultados (status → PROCESSADO)
//
// Acessível sem sessão (formulário público) e com sessão (dashboard do artisan).

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { schemaProcessarPedido, erroValidacao } from '@/lib/validations'
import { verificarRateLimit, extrairIpDoRequest } from '@/lib/rate-limit'
import { getTenantIdFromSession } from '@/lib/auth'

export async function POST(req: Request) {
  // ── 0. Rate limiting ────────────────────────────────────────────────────────
  const ip = extrairIpDoRequest(req)
  const limiteAtingido = await verificarRateLimit(ip, 'process-pedido')
  if (limiteAtingido) return limiteAtingido

  // ── 1. Parse e validação ────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido — esperado JSON.' }, { status: 400 })
  }

  const resultado = schemaProcessarPedido.safeParse(body)
  if (!resultado.success) return erroValidacao(resultado.error)

  const { pedidoId } = resultado.data

  // ── 2. Buscar pedido com tenant e tabela de preços ──────────────────────────
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      id: true,
      descricao: true,
      fotoUrl: true,
      status: true,
      tenantId: true,
      tenant: {
        select: {
          nome: true,
          servicos: {
            select: { categoria: true, precoMin: true, precoMax: true },
          },
        },
      },
    },
  })

  if (!pedido) {
    return NextResponse.json({ erro: 'Pedido introuvable.' }, { status: 404 })
  }

  // ── 3. Verificação de segurança ─────────────────────────────────────────────
  // Se há sessão de utilizador (chamada do dashboard): garante que o pedido
  // pertence ao tenant autenticado.
  // Se não há sessão (chamada do formulário público): permitido sem verificação.
  const tenantIdSessao = await getTenantIdFromSession()
  if (tenantIdSessao && tenantIdSessao !== pedido.tenantId) {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  }

  // ── 4. Buscar imagem do R2 e converter para base64 (se existir) ─────────────
  let imagemParaIA: { base64: string; mimeType: string } | null = null
  if (pedido.fotoUrl) {
    try {
      const imgResp = await fetch(pedido.fotoUrl)
      if (imgResp.ok) {
        const buffer = await imgResp.arrayBuffer()
        imagemParaIA = {
          base64: Buffer.from(buffer).toString('base64'),
          mimeType: imgResp.headers.get('content-type') ?? 'image/jpeg',
        }
      }
    } catch (e) {
      console.error('[process-pedido] Erro ao buscar imagem do R2:', e)
      // Continua sem imagem — não é erro fatal
    }
  }

  // ── 5. Construir system prompt em francês ───────────────────────────────────
  const listaPrecos = pedido.tenant.servicos
    .map((s) => `  - ${s.categoria}: de €${s.precoMin} à €${s.precoMax}`)
    .join('\n')

  const categoriasDisponiveis = pedido.tenant.servicos.map((s) => s.categoria).join(', ')

  const systemPrompt = `Tu es un assistant pour l'artisan "${pedido.tenant.nome}".
Analyse cette demande de devis et:
1. Classe la catégorie du travail parmi: ${categoriasDisponiveis}
2. Détermine l'urgence: BAIXA, NORMAL, ALTA, URGENTE
3. Si une catégorie correspond dans la liste de prix fournie, utilise les valeurs precoMin/precoMax correspondantes. Si aucune catégorie ne correspond clairement, indique categoria: "outro" et urgencia: "NORMAL", sans inventer de prix.
4. Génère une réponse professionnelle en français (max 100 mots) confirmant la réception, donnant une estimation de prix (ou indiquant qu'un devis détaillé sera envoyé si pas de catégorie claire), et indiquant qu'un rendez-vous sera proposé.
5. Réponds UNIQUEMENT en JSON: {"categoria": "...", "urgencia": "...", "precoMin": 0, "precoMax": 0, "resposta": "..."}

Tarifs disponibles:
${listaPrecos}`

  // ── 6. Chamar a API Claude (claude-sonnet-4-6) ──────────────────────────────
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let dadosIA: {
    categoria: string
    urgencia: string
    precoMin: number | null
    precoMax: number | null
    resposta: string
  }

  try {
    const conteudoUtilizador = imagemParaIA
      ? [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: imagemParaIA.mimeType as
                | 'image/jpeg'
                | 'image/png'
                | 'image/gif'
                | 'image/webp',
              data: imagemParaIA.base64,
            },
          },
          { type: 'text' as const, text: pedido.descricao },
        ]
      : pedido.descricao

    const resposta = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: conteudoUtilizador }],
    })

    const bloco = resposta.content.find((c) => c.type === 'text')
    if (!bloco || bloco.type !== 'text') throw new Error('Resposta da IA sem conteúdo de texto')

    // O Claude pode envolver o JSON em ```json ... ``` — extrai o conteúdo
    const texto = bloco.text.trim()
    const jsonStr =
      texto.match(/```json\s*([\s\S]*?)```/)?.[1] ??
      texto.match(/\{[\s\S]*\}/)?.[0] ??
      texto

    dadosIA = JSON.parse(jsonStr)
  } catch (e) {
    console.error('[process-pedido] Falha na chamada à IA ou no parse do JSON:', e)

    // Fallback: mantém o pedido PENDENTE para processamento manual pelo artisan
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { status: 'PENDENTE' },
    })

    return NextResponse.json(
      { erro: 'Une erreur technique est survenue. Le devis sera traité manuellement.' },
      { status: 500 }
    )
  }

  // ── 7. Normalizar urgência para os valores válidos do enum ──────────────────
  const urgenciasValidas = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'] as const
  type UrgenciaValida = (typeof urgenciasValidas)[number]
  const urgenciaFinal: UrgenciaValida = urgenciasValidas.includes(
    dadosIA.urgencia as UrgenciaValida
  )
    ? (dadosIA.urgencia as UrgenciaValida)
    : 'NORMAL'

  // ── 8. Atualizar pedido na BD com os resultados da IA ──────────────────────
  const pedidoAtualizado = await prisma.pedido.update({
    where: { id: pedidoId },
    data: {
      categoria: dadosIA.categoria ?? null,
      urgencia: urgenciaFinal,
      precoMin: dadosIA.precoMin ?? null,
      precoMax: dadosIA.precoMax ?? null,
      respostaIA: dadosIA.resposta ?? null,
      status: 'PROCESSADO',
      respondidoEm: new Date(),
    },
    select: {
      id: true,
      categoria: true,
      urgencia: true,
      precoMin: true,
      precoMax: true,
      respostaIA: true,
      status: true,
      respondidoEm: true,
    },
  })

  return NextResponse.json({ sucesso: true, pedido: pedidoAtualizado })
}
