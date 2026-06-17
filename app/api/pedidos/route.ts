// Endpoint público — chamado pelo formulário do cliente final (/pedido/[tenantId]).
// Cria o pedido na BD com status PENDENTE e devolve o pedidoId.
// A classificação pela IA acontece numa chamada separada a /api/process-pedido.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { schemaPedido, erroValidacao } from '@/lib/validations'
import { verificarRateLimit, extrairIpDoRequest } from '@/lib/rate-limit'

export async function POST(req: Request) {
  // ── 0. Rate limiting ────────────────────────────────────────────────────────
  const ip = extrairIpDoRequest(req)
  const limiteAtingido = await verificarRateLimit(ip, 'criar-pedido')
  if (limiteAtingido) return limiteAtingido

  // ── 1. Parse e validação com zod ────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido — esperado JSON.' }, { status: 400 })
  }

  const resultado = schemaPedido.safeParse(body)
  if (!resultado.success) return erroValidacao(resultado.error)

  const { tenantId, nomeCliente, telefoneCliente, descricao, fotoUrl } = resultado.data

  // ── 2. Verificar que o tenant existe ────────────────────────────────────────
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, nome: true },
  })

  if (!tenant) {
    return NextResponse.json(
      { erro: 'Artisan non trouvé. Vérifiez le lien du formulaire.' },
      { status: 404 }
    )
  }

  // ── 3. Criar o pedido com status PENDENTE ───────────────────────────────────
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

  return NextResponse.json({ sucesso: true, pedidoId: pedido.id }, { status: 201 })
}
