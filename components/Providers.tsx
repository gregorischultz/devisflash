'use client'

// SessionProvider precisa de ser um Client Component porque gere estado no browser.
// Envolvemos a aplicação com este componente para que qualquer página possa
// usar useSession() para aceder aos dados do utilizador autenticado.

import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
