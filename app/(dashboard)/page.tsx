// Página de Dashboard — a primeira página que o artisan vê ao entrar

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao devisflash. Aqui tens um resumo do teu dia.</p>
      </div>

      {/* Cartões de resumo — números rápidos do dia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <CartaoResumo titulo="Pedidos hoje" valor="0" cor="blue" />
        <CartaoResumo titulo="Aguardam resposta" valor="0" cor="yellow" />
        <CartaoResumo titulo="Confirmados este mês" valor="0" cor="green" />
      </div>

      {/* Secção de pedidos recentes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Pedidos Recentes</h2>
        <p className="text-gray-400 text-sm text-center py-8">
          Ainda não tens pedidos. Quando chegarem, aparecem aqui.
        </p>
      </div>
    </div>
  )
}

function CartaoResumo({
  titulo,
  valor,
  cor,
}: {
  titulo: string
  valor: string
  cor: 'blue' | 'yellow' | 'green'
}) {
  const cores = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className={`text-3xl font-bold mt-2 ${cores[cor]}`}>{valor}</p>
    </div>
  )
}
