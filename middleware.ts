// Middleware — corre antes de CADA pedido ao servidor.
// Responsabilidades:
//   1. Deixar passar rotas públicas (login, registo, formulário do cliente, uploads)
//   2. Bloquear rotas protegidas se o utilizador não tiver sessão válida
//   3. Redirecionar utilizadores já autenticados fora das páginas de auth

import { auth } from '@/auth'
import { NextResponse } from 'next/server'

// ─── ROTAS PÚBLICAS ────────────────────────────────────────────────────────────
// Tudo o que começa com um destes prefixos é acessível sem login.

const PREFIXOS_PUBLICOS = [
  // Páginas de autenticação
  '/login',
  '/registo',
  // Formulário público do cliente final — URL único por artisan: /pedido/<tenantId>
  '/pedido',
  // Rotas do NextAuth — têm a sua própria autenticação interna
  '/api/auth',
  // API chamada pelo formulário público para criar o pedido e lançar a IA
  '/api/process-pedido',
  // API de upload de fotos — também usada pelo formulário público
  '/api/upload',
]

function eRotaPublica(pathname: string): boolean {
  return PREFIXOS_PUBLICOS.some(
    (prefixo) => pathname === prefixo || pathname.startsWith(prefixo + '/')
  )
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const estaAutenticado = !!req.auth
  const publica = eRotaPublica(pathname)

  // ── Rota protegida sem sessão ──────────────────────────────────────────────
  if (!estaAutenticado && !publica) {
    // API routes: devolvem 401 JSON em vez de redirecionar para HTML
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { erro: 'Não autenticado. Faz login primeiro.' },
        { status: 401 }
      )
    }
    // Páginas: redireciona para /login
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Utilizador já autenticado a aceder a páginas de auth ──────────────────
  // Evita que alguém logado fique preso em /login ou /registo
  if (estaAutenticado && (pathname === '/login' || pathname === '/registo')) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ── Tudo o resto: deixa passar ────────────────────────────────────────────
  return NextResponse.next()
})

// O matcher cobre tudo exceto os ficheiros estáticos gerados pelo Next.js.
// Nota: /api/* está INCLUÍDO — o middleware verifica autenticação nas APIs também.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
