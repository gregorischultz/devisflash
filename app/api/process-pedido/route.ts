// Endpoint público — chamado pelo formulário do cliente final (/pedido/[tenantId]).
// Não requer autenticação: é o cliente (dono de casa, etc.) que submete o pedido.
//
// Fluxo:
//   1. Validar dados com zod (antes de qualquer outra operação)
//   2. Verificar que o tenant existe
//   3. Criar o Pedido na BD com status PENDENTE
//   4. [TODO] Chamar a IA para classificar e gerar orçamento (assíncrono)

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { schemaPedido, erroValidacao } from '@/lib/validations'

export async function POST(req: Request) {
  // ── 1. Parse e validação ────────────────────────────────────────────────────
  // A validação acontece ANTES de qualquer acesso à BD ou à API Claude.
  // Se os dados são inválidos, não gastamos recursos desnecessários.
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
  // O tenantId vem do formulário público. Confirmamos que é válido antes de criar o pedido.
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
      // Status inicial: PENDENTE — a IA ainda não processou
      status: 'PENDENTE',
    },
    select: {
      id: true,
      nomeCliente: true,
      status: true,
      criadoEm: true,
    },
  })

  // ── 4. Disparar processamento pela IA ───────────────────────────────────────
  // [TODO: Fase A] Aqui chamamos /api/ai/processar com o pedido.id
  // Por agora, o pedido fica PENDENTE e será processado manualmente ou num job.

  return NextResponse.json(
    {
      sucesso: true,
      mensagem: `Pedido recebido! ${tenant.nome} vai entrar em contacto em breve.`,
      pedidoId: pedido.id,
    },
    { status: 201 }
  )
}
