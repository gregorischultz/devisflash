// Layout raiz — envolve todas as páginas da aplicação.
// Tudo o que está aqui aparece em TODAS as páginas.

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

// Fonte Inter do Google — moderna e fácil de ler
const inter = Inter({ subsets: ['latin'] })

// Metadados que aparecem no separador do browser
export const metadata: Metadata = {
  title: 'devisflash — Orçamentos Instantâneos',
  description: 'Sistema de orçamentos automáticos para artisans',
}

// O layout principal divide o ecrã em dois: sidebar à esquerda e conteúdo à direita
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Menu lateral — aparece em todas as páginas */}
          <Sidebar />

          {/* Área de conteúdo principal */}
          <main className="flex-1 p-8 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
