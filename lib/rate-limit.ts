// Rate limiting baseado em base de dados — sem Redis nem serviços externos.
//
// Funcionamento:
//   1. A cada pedido, apaga registos antigos (> 1 hora) para manter a tabela pequena
//   2. Conta quantos registos este IP tem neste endpoint na última hora
//   3. Se >= LIMITE: devolve 429. Se não: regista o pedido e continua.
//
// Limitação conhecida: em cenários de muito tráfego simultâneo, dois pedidos
// podem passar ao mesmo tempo (race condition). Para 5 req/hora em produção
// pequena, isto é aceitável sem Redis. Ver docs/TECNICO.md para alternativas.

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
// Muda estes valores para ajustar o limite no futuro

export const LIMITE_POR_HORA = 5
const JANELA_MS = 60 * 60 * 1000 // 1 hora em milissegundos

// Mensagem em francês — é o idioma do utilizador final (Tours, França)
export const MENSAGEM_LIMITE =
  'Trop de demandes. Veuillez réessayer dans une heure.'

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────

/**
 * Verifica se o IP excedeu o limite de pedidos para este endpoint.
 * Devolve NextResponse 429 se o limite foi atingido, ou null se pode continuar.
 *
 * Uso em API routes:
 *   const ip = extrairIpDoRequest(req)
 *   const limite = await verificarRateLimit(ip, 'process-pedido')
 *   if (limite) return limite
 *
 * Uso em Server Components:
 *   const ip = extrairIpDosHeaders()
 *   const limite = await verificarRateLimit(ip, 'pedido-page')
 *   if (limite) { render error UI }
 */
export async function verificarRateLimit(
  ip: string,
  endpoint: string
): Promise<NextResponse | null> {
  const umaHoraAtras = new Date(Date.now() - JANELA_MS)

  // Transação: limpeza + contagem acontecem juntas para maior consistência
  const contagem = await prisma.$transaction(async (tx) => {
    // Apaga registos expirados — mantém a tabela pequena sem cron job
    await tx.rateLimit.deleteMany({
      where: { criadoEm: { lt: umaHoraAtras } },
    })

    // Conta pedidos deste IP neste endpoint na última hora
    const count = await tx.rateLimit.count({
      where: { ip, endpoint, criadoEm: { gte: umaHoraAtras } },
    })

    // Regista este pedido dentro da transação (reduz race condition)
    if (count < LIMITE_POR_HORA) {
      await tx.rateLimit.create({ data: { ip, endpoint } })
    }

    return count
  })

  if (contagem >= LIMITE_POR_HORA) {
    return NextResponse.json(
      { erro: MENSAGEM_LIMITE },
      {
        status: 429,
        headers: {
          // Informa o cliente quanto tempo esperar antes de tentar novamente
          'Retry-After': '3600',
          'X-RateLimit-Limit': String(LIMITE_POR_HORA),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  return null // passou o rate limit — pode continuar
}

// ─── EXTRAÇÃO DE IP ───────────────────────────────────────────────────────────

/**
 * Extrai o IP real do cliente a partir dos headers de um Request (API routes).
 * x-forwarded-for é preenchido por proxies como Vercel, Cloudflare, nginx.
 */
export function extrairIpDoRequest(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp

  return '127.0.0.1' // fallback para desenvolvimento local
}

/**
 * Extrai o IP real do cliente nos Server Components do Next.js.
 * Usa o módulo next/headers que só existe no servidor.
 */
export async function extrairIpDosHeaders(): Promise<string> {
  const { headers } = await import('next/headers')
  const h = await headers()

  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = h.get('x-real-ip')
  if (realIp) return realIp

  return '127.0.0.1'
}
