// Página de Configurações — onde o artisan personaliza a sua conta e tabela de preços

export default function Configuracoes() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Personaliza a tua conta e a tabela de preços.</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Dados Pessoais</h2>
          <div className="space-y-4">
            <Campo label="Nome" placeholder="O teu nome" />
            <Campo label="Email" placeholder="email@exemplo.com" tipo="email" />
            <Campo label="Telefone" placeholder="+351 900 000 000" tipo="tel" />
          </div>
          <button className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
            Guardar alterações
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Tabela de Preços</h2>
          <p className="text-sm text-gray-500 mb-4">
            A IA usa esta tabela para gerar os pré-orçamentos automaticamente.
          </p>
          <div className="space-y-3">
            <Campo label="Visita / Deslocação (€)" placeholder="ex: 25" tipo="number" />
            <Campo label="Hora de mão de obra (€)" placeholder="ex: 45" tipo="number" />
            <Campo label="Urgência fora de horas (+%)" placeholder="ex: 50" tipo="number" />
          </div>
          <button className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
            Guardar tabela
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Plano Atual</h2>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              Básico — 39€/mês
            </span>
            <span className="text-sm text-gray-500">50 pedidos/mês incluídos</span>
          </div>
          <button className="mt-4 text-sm text-brand-600 font-medium hover:underline">
            Fazer upgrade para PRO →
          </button>
        </div>
      </div>
    </div>
  )
}

function Campo({
  label,
  placeholder,
  tipo = 'text',
}: {
  label: string
  placeholder: string
  tipo?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={tipo}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
    </div>
  )
}
