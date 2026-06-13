'use client'

// A sidebar é o menu lateral que aparece em todas as páginas.
// O 'use client' é necessário porque usamos hooks do Next.js (usePathname).

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Lista de links que aparecem no menu lateral
const links = [
  {
    href: '/',
    label: 'Dashboard',
    // Ícone SVG simples para cada secção
    icone: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/pedidos',
    label: 'Pedidos',
    icone: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/estatisticas',
    label: 'Estatísticas',
    icone: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/configuracoes',
    label: 'Configurações',
    icone: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  // usePathname diz-nos qual é a página atual para destacar o link ativo
  const caminhoAtual = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo / Nome do produto */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-brand-700">
          ⚡ devisflash
        </h1>
        <p className="text-xs text-gray-500 mt-1">Orçamentos instantâneos</p>
      </div>

      {/* Links de navegação */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          // Verifica se este link é a página atual
          const estaAtivo =
            link.href === '/'
              ? caminhoAtual === '/'
              : caminhoAtual.startsWith(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                estaAtivo
                  ? 'bg-brand-50 text-brand-700' // Estilo para link ativo
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Estilo normal
              }`}
            >
              {link.icone}
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé da sidebar com versão */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">v0.1.0 — em desenvolvimento</p>
      </div>
    </aside>
  )
}
