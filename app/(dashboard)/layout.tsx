// Layout do dashboard — envolve todas as páginas protegidas (que precisam de login).
// O grupo de rotas (dashboard) é invisível para os URLs:
//   app/(dashboard)/page.tsx       → URL: /
//   app/(dashboard)/pedidos/...    → URL: /pedidos
// Assim, as páginas de login e registo ficam fora deste layout (sem sidebar).

import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Menu lateral — aparece em todas as páginas do dashboard */}
      <Sidebar />

      {/* Área de conteúdo principal */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
