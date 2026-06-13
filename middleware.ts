// Middleware — código que corre antes de CADA pedido ao servidor.
// Usamos para proteger as páginas do dashboard: se não estás autenticado,
// és redirecionado para /login automaticamente.

import { auth } from '@/auth'
import { NextResponse } from 'next/server'

// Páginas que qualquer pessoa pode ver, mesmo sem estar autenticada
const PAGINAS_PUBLICAS = ['/login', '/registo']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const estaAutenticado = !!req.auth

  const ePaginaPublica = PAGINAS_PUBLICAS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  // Utilizador não autenticado a tentar aceder a uma página protegida → /login
  if (!estaAutenticado && !ePaginaPublica) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Utilizador já autenticado a tentar ir para /login ou /registo → /dashboard
  if (estaAutenticado && ePaginaPublica) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
})

// Define quais os caminhos que o middleware verifica.
// Excluímos os ficheiros estáticos e as API routes do NextAuth.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
