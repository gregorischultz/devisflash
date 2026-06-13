// Este ficheiro cria uma única instância do cliente Prisma para toda a aplicação.
// Em desenvolvimento, evita criar demasiadas conexões à base de dados.

import { PrismaClient } from '@prisma/client'

// Variável global para guardar a instância em desenvolvimento
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'], // Mostra as queries SQL no terminal durante o desenvolvimento
  })

// Em desenvolvimento, guarda a instância na variável global para reutilizar
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
