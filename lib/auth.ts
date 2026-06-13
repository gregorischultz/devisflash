// Helpers de autenticação e autorização para usar nos API route handlers.
//
// REGRA DE OURO (multi-tenancy):
//   Nunca confiar no tenantId vindo do URL ou do body do pedido.
//   Usar SEMPRE o tenantId da sessão do utilizador autenticado.
//   Isto garante que o Tenant A nunca consegue ver ou editar dados do Tenant B.

import { auth } from '@/auth'
import { NextResponse } from 'next/server'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

// Resultado discriminado: ou tens tenantId e sem erro, ou tens erro e sem tenantId.
// TypeScript estreita o tipo automaticamente depois de `if (erro) return erro`.
type ResultadoAuth =
  | { tenantId: string; erro: null }
  | { tenantId: null; erro: NextResponse }

type ResultadoAcesso =
  | { autorizado: true; tenantId: string; erro: null }
  | { autorizado: false; tenantId: null; erro: NextResponse }

// ─── FUNÇÕES ──────────────────────────────────────────────────────────────────

/**
 * Lê o tenantId do cookie de sessão do utilizador autenticado.
 * Devolve null se não houver sessão ou se o tenant não estiver ligado ao user.
 *
 * Uso: const tenantId = await getTenantIdFromSession()
 */
export async function getTenantIdFromSession(): Promise<string | null> {
  const session = await auth()
  return session?.user?.tenantId ?? null
}

/**
 * Para usar no início de QUALQUER API route protegida.
 * Verifica se há sessão e devolve o tenantId pronto a usar.
 *
 * Exemplo:
 *   const { tenantId, erro } = await exigirTenantAutenticado()
 *   if (erro) return erro   // ← devolve 401 automaticamente
 *   // a partir daqui, tenantId é string garantida
 */
export async function exigirTenantAutenticado(): Promise<ResultadoAuth> {
  const tenantId = await getTenantIdFromSession()

  if (!tenantId) {
    return {
      tenantId: null,
      erro: NextResponse.json(
        { erro: 'Não autenticado. Faz login primeiro.' },
        { status: 401 }
      ),
    }
  }

  return { tenantId, erro: null }
}

/**
 * Verifica se um recurso (pedido, preço, etc.) pertence ao tenant autenticado.
 * Usa quando já tens o recurso em memória e queres confirmar que é do tenant certo.
 *
 * Exemplo:
 *   const pedido = await prisma.pedido.findUnique({ where: { id } })
 *   if (!pedido) return NotFound()
 *   const { autorizado, tenantId, erro } = await verificarAcessoTenant(pedido.tenantId)
 *   if (!autorizado) return erro  // ← devolve 403 se for de outro tenant
 *
 * @param tenantIdDoRecurso  O tenantId guardado no registo da base de dados
 */
export async function verificarAcessoTenant(
  tenantIdDoRecurso: string
): Promise<ResultadoAcesso> {
  const tenantIdSessao = await getTenantIdFromSession()

  if (!tenantIdSessao) {
    return {
      autorizado: false,
      tenantId: null,
      erro: NextResponse.json(
        { erro: 'Não autenticado.' },
        { status: 401 }
      ),
    }
  }

  // Comparação crítica: tenantId da sessão VS tenantId do recurso na BD
  if (tenantIdSessao !== tenantIdDoRecurso) {
    return {
      autorizado: false,
      tenantId: null,
      erro: NextResponse.json(
        { erro: 'Acesso negado. Estes dados não pertencem à tua conta.' },
        { status: 403 }
      ),
    }
  }

  return { autorizado: true, tenantId: tenantIdSessao, erro: null }
}

// ─── PADRÕES DE USO ───────────────────────────────────────────────────────────
//
// PADRÃO A — Listar/criar recursos do tenant logado:
//
//   export async function GET() {
//     const { tenantId, erro } = await exigirTenantAutenticado()
//     if (erro) return erro
//
//     const pedidos = await prisma.pedido.findMany({
//       where: { tenantId },   // ← filtra SEMPRE pelo tenantId da sessão
//     })
//     return NextResponse.json(pedidos)
//   }
//
// PADRÃO B — Aceder a um recurso específico por ID:
//
//   export async function GET(req, { params }) {
//     const pedido = await prisma.pedido.findUnique({ where: { id: params.id } })
//     if (!pedido) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 })
//
//     const { autorizado, erro } = await verificarAcessoTenant(pedido.tenantId)
//     if (!autorizado) return erro  // ← devolve 403 se for de outro tenant
//
//     return NextResponse.json(pedido)
//   }
