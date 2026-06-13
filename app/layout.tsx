// Layout raiz — envolve TODAS as páginas da aplicação (incluindo login/registo).
// Contém apenas o esqueleto HTML e o provider de sessão do NextAuth.
// O layout do dashboard (com sidebar) está em app/(dashboard)/layout.tsx.

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'devisflash — Orçamentos Instantâneos',
  description: 'Sistema de orçamentos automáticos para artisans',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        {/* Providers disponibiliza a sessão do NextAuth para todos os componentes */}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
