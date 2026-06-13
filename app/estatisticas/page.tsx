// Página de Estatísticas — mostra o desempenho do artisan ao longo do tempo

export default function Estatisticas() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Estatísticas</h1>
        <p className="text-gray-500 mt-1">Acompanha o desempenho do teu negócio.</p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { titulo: 'Total de pedidos', valor: '0', descricao: 'desde o início' },
          { titulo: 'Taxa de conversão', valor: '0%', descricao: 'pedidos → confirmados' },
          { titulo: 'Receita estimada', valor: '0 €', descricao: 'este mês' },
          { titulo: 'Tempo médio de resposta', valor: '< 1 min', descricao: 'resposta automática' },
        ].map((metrica) => (
          <div key={metrica.titulo} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{metrica.titulo}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{metrica.valor}</p>
            <p className="text-xs text-gray-400 mt-1">{metrica.descricao}</p>
          </div>
        ))}
      </div>

      {/* Espaço reservado para gráficos — serão adicionados depois */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Pedidos por semana</h2>
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          O gráfico será exibido aqui quando houver dados suficientes.
        </div>
      </div>
    </div>
  )
}
