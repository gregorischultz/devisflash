// Configuração central da autenticação com NextAuth v5 (Auth.js).
// Este ficheiro é importado pelo middleware, pelas páginas e pelas API routes.

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // O adapter liga o NextAuth à nossa base de dados MySQL via Prisma
  adapter: PrismaAdapter(prisma),

  // "jwt" significa que a sessão é guardada num cookie encriptado,
  // não numa tabela Session da base de dados (mais simples e rápido)
  session: { strategy: 'jwt' },

  // Quando o utilizador não está autenticado, redireciona para /login
  pages: {
    signIn: '/login',
  },

  providers: [
    // Credentials = login com email + senha (o nosso caso de uso)
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Procura o utilizador na base de dados pelo email
        const utilizador = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { tenant: true },
        })

        // Se não existe ou não tem senha definida, recusa o login
        if (!utilizador?.password) return null

        // Compara a senha enviada com o hash guardado na base de dados
        // bcrypt.compare faz isto de forma segura sem revelar a senha real
        const senhaCorreta = await bcrypt.compare(
          credentials.password as string,
          utilizador.password
        )

        if (!senhaCorreta) return null

        // Devolve os dados que vão ficar guardados no JWT (cookie de sessão)
        return {
          id: utilizador.id,
          email: utilizador.email,
          name: utilizador.name,
          tenantId: utilizador.tenant?.id ?? null,
        }
      },
    }),
  ],

  callbacks: {
    // jwt é chamado quando o token é criado (login) ou renovado
    // Aqui adicionamos o tenantId ao token para o ter disponível depois
    jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as { tenantId?: string }).tenantId
      }
      return token
    },

    // session é chamado quando alguém usa useSession() ou auth() para ler a sessão
    // Aqui passamos o tenantId do token para a sessão acessível no cliente
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
})
