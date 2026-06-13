// Endpoint público — chamado pelo formulário do cliente final (/pedido/[tenantId]).
// Não requer autenticação: é o cliente (dono de casa, etc.) que submete o pedido.
//
// Fluxo (por ordem de execução):
//   0. Rate limiting — bloqueia se o IP excedeu 5 pedidos/hora
//   1. Validação com zod — antes de qualquer operação na BD ou API Claude
//   2. Verificar que o tenant existe
//   3. Criar o Pedido na BD com status PENDENTE
//   4. [TODO] Chamar a IA para classificar e gerar orçamento

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { schemaPedido, erroValidacao } from '@/lib/validations'
import { verificarRateLimit, extrairIpDoRequest } from '@/lib/rate-limit'

export async function POST(req: Request) {
  // ── 0. Rate limiting ────────────────────────────────────────────────────────
  // Primeira coisa a verificar — se o IP já excedeu o limite, não fazemos nada mais.
  // Isto evita que um bot pague tokens de IA ao enviar centenas de pedidos.
  const ip = extrairIpDoRequest(req)
  const limiteAtingido = await verificarRateLimit(ip, 'process-pedido')
  if (limiteAtingido) return limiteAtingido

  // ── 1. Parse e validação com zod ────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido — esperado JSON.' }, { status: 400 })
  }

  const resultado = schemaPedido.safeParse(body)
  if (!resultado.success) {
    return erroValidacao(resultado.error)
  }

  const { tenantId, nomeCliente, telefoneCliente, descricao, fotoUrl } = resultado.data

  // ── 2. Verificar que o tenant existe ────────────────────────────────────────
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, nome: true },
  })

  if (!tenant) {
    return NextResponse.json(
      { erro: 'Artisan não encontrado. Verifica o link do formulário.' },
      { status: 404 }
    )
  }

  // ── 3. Criar o pedido na base de dados ──────────────────────────────────────
  const pedido = await prisma.pedido.create({
    data: {
      tenantId,
      nomeCliente,
      telefoneCliente,
      descricao,
      fotoUrl: fotoUrl ?? null,
      status: 'PENDENTE',
    },
    select: { id: true },
  })

  // ── 4. Disparar processamento pela IA ───────────────────────────────────────
  // [TODO: Fase A] Chamar /api/ai/processar com pedido.id de forma assíncrona

  return NextResponse.json(
    {
      sucesso: true,
      mensagem: `Pedido recebido ! ${tenant.nome} vous contactera très bientôt.`,
      pedidoId: pedido.id,
    },
    { status: 201 }
  )
}
