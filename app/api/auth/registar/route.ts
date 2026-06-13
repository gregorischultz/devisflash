// API Route para registar um novo tenant (artisan) no sistema.
// Recebe nome, email e senha. Cria um User com senha em hash e um Tenant ligado.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { nome, email, senha } = await req.json()

  // Validação básica dos campos obrigatórios
  if (!nome || !email || !senha) {
    return NextResponse.json(
      { erro: 'Preenche todos os campos obrigatórios.' },
      { status: 400 }
    )
  }

  if (senha.length < 8) {
    return NextResponse.json(
      { erro: 'A senha deve ter pelo menos 8 caracteres.' },
      { status: 400 }
    )
  }

  // Verifica se já existe um utilizador com este email
  const utilizadorExistente = await prisma.user.findUnique({
    where: { email },
  })

  if (utilizadorExistente) {
    return NextResponse.json(
      { erro: 'Este email já está registado.' },
      { status: 409 }
    )
  }

  // Gera o hash da senha com bcrypt (fator 12 = bom equilíbrio entre segurança e velocidade)
  // NUNCA guardamos a senha em texto puro — se a base de dados for comprometida, as senhas ficam protegidas
  const senhaHash = await bcrypt.hash(senha, 12)

  // Cria o User e o Tenant numa única operação (transação implícita do Prisma)
  // O Tenant fica ligado ao User através do campo userId
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
