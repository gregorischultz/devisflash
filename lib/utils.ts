// Funções utilitárias usadas em vários sítios da aplicação

// Formata um valor numérico como preço em euros
// Exemplo: formatarPreco(39) → "39,00 €"
export function formatarPreco(valor: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(valor)
}

// Formata uma data para o formato português
// Exemplo: formatarData(new Date()) → "13 de junho de 2026"
export function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(data)
}

// Retorna a cor da etiqueta de urgência para mostrar no ecrã
export function corUrgencia(urgencia: string): string {
  const cores: Record<string, string> = {
    alta: 'bg-red-100 text-red-700',
    media: 'bg-yellow-100 text-yellow-700',
    baixa: 'bg-green-100 text-green-700',
  }
  return cores[urgencia] ?? 'bg-gray-100 text-gray-700'
}
