// API Route para registar um novo tenant (artisan) no sistema.
// Recebe nome, email e senha. Valida com zod antes de criar qualquer registo.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { schemaRegistar, erroValidacao } from '@/lib/validations'

export async function POST(req: Request) {
  // ── 1. Parse e validação com zod ────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido — esperado JSON.' }, { status: 400 })
  }

  const resultado = schemaRegistar.safeParse(body)
  if (!resultado.success) {
    return erroValidacao(resultado.error)
  }

  const { nome, email, senha } = resultado.data

  // ── 2. Verificar unicidade do email ─────────────────────────────────────────
  const utilizadorExistente = await prisma.user.findUnique({ where: { email } })
  if (utilizadorExistente) {
    return NextResponse.json(
      { erro: 'Este email já está registado.' },
      { status: 409 }
    )
  }

  // ── 3. Hash da senha e criação do User + Tenant ─────────────────────────────
  // bcrypt com fator 12 — NUNCA guardamos senhas em texto puro
  const senhaHash = await bcrypt.hash(senha, 12)

  await prisma.user.create({
    data: {
      name: nome,
      email,
      password: senhaHash,
      tenant: {
        create: {
          nome,
          email,
          plano: 'BASICO',
          corPrimaria: '#2563eb',
        },
      },
    },
  })

  return NextResponse.json({ sucesso: true }, { status: 201 })
}
