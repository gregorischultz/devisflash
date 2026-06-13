// Extensão dos tipos TypeScript do NextAuth.
// Adicionamos o campo tenantId à sessão para saber a qual tenant pertence o utilizador.

import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      tenantId?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    tenantId?: string
  }
}
