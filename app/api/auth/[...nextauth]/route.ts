// Route handler do NextAuth — responde a todos os pedidos em /api/auth/*
// (login, logout, callback, session, etc.)
// Não precisas de editar este ficheiro.

import { handlers } from '@/auth'

export const { GET, POST } = handlers
