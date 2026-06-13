// Página pública do formulário de pedido — partilhada pelo artisan com os seus clientes.
// URL: /pedido/<tenantId>
//
// Esta página é a única forma do cliente final pedir um orçamento.
// Não requer login. Tem rate limiting: máx. 5 visitas por IP por hora.

import { prisma } from '@/lib/prisma'
import { verificarRateLimit, extrairIpDosHeaders, MENSAGEM_LIMITE } from '@/lib/rate-limit'
import { notFound } from 'next/navigation'
import FormularioPedido from './FormularioPedido'

interface Props {
  params: Promise<{ tenantId: string }>
}

export default async function PaginaPedido({ params }: Props) {
  const { tenantId } = await params

  // ── Rate limiting ──────────────────────────────────────────────────────────
  // Verifica antes de ir à BD — se o IP está bloqueado, não fazemos nada mais.
  const ip = await extrairIpDosHeaders()
  const limiteAtingido = await verificarRateLimit(ip, 'pedido-page')

  if (limiteAtingido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-md w-full text-center shadow-sm">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Accès temporairement limité
          </h1>
          <p className="text-gray-600 text-sm">{MENSAGEM_LIMITE}</p>
        </div>
      </div>
    )
  }

  // ── Buscar dados do tenant ─────────────────────────────────────────────────
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      nome: true,
      telefone: true,
      corPrimaria: true,
      logoUrl: true,
    },
  })

  // Tenant inválido → 404 (não revela que o tenant existe ou não)
  if (!tenant) return notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho com branding do artisan */}
      <header
        className="py-5 px-6 text-white text-center"
        style={{ backgroundColor: tenant.corPrimaria }}
      >
        {tenant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tenant.logoUrl}
            alt={tenant.nome}
            className="h-10 mx-auto object-contain"
          />
        ) : (
          <h1 className="text-xl font-bold">{tenant.nome}</h1>
        )}
        <p className="text-sm mt-1 opacity-90">Demande de devis gratuit</p>
      </header>

      {/* Formulário */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <FormularioPedido
          tenantId={tenant.id}
          corPrimaria={tenant.corPrimaria}
        />
      </main>
    </div>
  )
}
