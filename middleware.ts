// Middleware — corre antes de CADA pedido ao servidor, no Edge Runtime.
// Usa NextAuth(authConfig) — versão sem Prisma, segura para Edge.
// A verificação da sessão é feita via JWT (crypto puro, sem base de dados).

import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

// Instância leve do NextAuth — só para ler/validar o JWT cookie no Edge.
const { auth } = NextAuth(authConfig)

// ─── ROTAS PÚBLICAS ────────────────────────────────────────────────────────────
const PREFIXOS_PUBLICOS = [
  '/login',
  '/registo',
  '/pedido',
  '/api/auth',
  '/api/pedidos',        // criação de pedido pelo formulário público
  '/api/process-pedido', // classificação por IA (chamada após criação)
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
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { erro: 'Não autenticado. Faz login primeiro.' },
        { status: 401 }
      )
    }
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Utilizador autenticado a aceder a páginas de auth ─────────────────────
  if (estaAutenticado && (pathname === '/login' || pathname === '/registo')) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
