// Configuração completa do NextAuth — corre apenas em Node.js (nunca no Edge).
// Importa a config base (auth.config.ts) e adiciona o PrismaAdapter e o
// authorize() real com bcrypt. Importado por Server Components e API routes.

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // O adapter liga o NextAuth à base de dados MySQL via Prisma.
  // Só é seguro aqui (Node.js) — o middleware usa auth.config.ts sem adapter.
  adapter: PrismaAdapter(prisma),

  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // select explícito: carregamos apenas os campos necessários.
        // A password nunca sai daqui — usada só para comparação e descartada.
        const utilizador = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            tenant: { select: { id: true } },
          },
        })

        if (!utilizador?.password) return null

        const senhaCorreta = await bcrypt.compare(
          credentials.password as string,
          utilizador.password
        )

        if (!senhaCorreta) return null

        return {
          id: utilizador.id,
          email: utilizador.email,
          name: utilizador.name,
          tenantId: utilizador.tenant?.id ?? null,
        }
      },
    }),
  ],
})
