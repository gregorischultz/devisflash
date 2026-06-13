// Configuração mínima do NextAuth — sem Prisma, segura para Edge Runtime.
// Usada pelo middleware para verificar sessões (leitura do JWT cookie).
// A configuração completa (com PrismaAdapter e authorize real) está em auth.ts.

import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },

  providers: [
    // Credentials declarado aqui para o NextAuth reconhecer o provider no JWT.
    // authorize() está vazio porque só é chamado durante o login,
    // que acontece num Server Action / API route com Node.js — nunca no middleware.
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize() {
        return null
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as { tenantId?: string }).tenantId
      }
      return token
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          tenantId: token.tenantId as string | undefined,
        },
      }
    },
  },
} satisfies NextAuthConfig
