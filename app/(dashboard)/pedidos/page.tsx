// Página de Pedidos — lista todos os pedidos recebidos

export default function Pedidos() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 mt-1">Todos os pedidos de orçamento recebidos.</p>
        </div>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 mb-6">
        {['Todos', 'Pendentes', 'Confirmados', 'Concluídos'].map((filtro) => (
          <button
            key={filtro}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {filtro}
          </button>
        ))}
      </div>

      {/* Tabela de pedidos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Cliente</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Tipo de Trabalho</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Urgência</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Preço Est.</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Estado</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Data</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                Ainda não há pedidos. Quando chegarem via WhatsApp ou formulário, aparecem aqui.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
