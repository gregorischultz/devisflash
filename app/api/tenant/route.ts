// Endpoint protegido para o artisan ler e atualizar o seu próprio perfil de tenant.
// Requer autenticação — o tenantId vem sempre da sessão, nunca do body ou URL.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exigirTenantAutenticado } from '@/lib/auth'
import { schemaTenantUpdate, erroValidacao } from '@/lib/validations'

// GET /api/tenant — retorna o perfil do tenant autenticado
export async function GET() {
  const { tenantId, erro } = await exigirTenantAutenticado()
  if (erro) return erro

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      plano: true,
      corPrimaria: true,
      logoUrl: true,
      criadoEm: true,
    },
  })

  if (!tenant) {
    return NextResponse.json({ erro: 'Tenant não encontrado.' }, { status: 404 })
  }

  return NextResponse.json(tenant)
}

// PATCH /api/tenant — atualiza campos do perfil do tenant autenticado
export async function PATCH(req: Request) {
  const { tenantId, erro } = await exigirTenantAutenticado()
  if (erro) return erro

  // ── Validação com zod antes de tocar na BD ──────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido — esperado JSON.' }, { status: 400 })
  }

  const resultado = schemaTenantUpdate.safeParse(body)
  if (!resultado.success) {
    return erroValidacao(resultado.error)
  }

  const dados = resultado.data

  // Garante que não há nada para atualizar se o body chegou vazio
  if (Object.keys(dados).length === 0) {
    return NextResponse.json(
      { erro: 'Nenhum campo enviado para atualizar.' },
      { status: 400 }
    )
  }

  // Verifica unicidade do email se estiver a ser alterado
  if (dados.email) {
    const emailEmUso = await prisma.tenant.findFirst({
      where: { email: dados.email, id: { not: tenantId } },
    })
    if (emailEmUso) {
      return NextResponse.json(
        { erro: 'Este email já está a ser usado por outra conta.' },
        { status: 409 }
      )
    }
  }

  const tenantAtualizado = await prisma.tenant.update({
    where: { id: tenantId },
    data: dados,
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      plano: true,
      corPrimaria: true,
      logoUrl: true,
    },
  })

  return NextResponse.json(tenantAtualizado)
}
