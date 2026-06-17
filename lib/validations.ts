// Schemas de validação centralizados com zod.
// Importa daqui em todos os endpoints que recebem dados do utilizador.
//
// Porquê validar antes de tocar na BD ou chamar a API Claude?
//   - Evita gastar tokens de IA com dados mal formatados
//   - Protege a BD de dados inválidos
//   - Devolve erros claros ao cliente em vez de crashes internos

import { z } from 'zod'
import { NextResponse } from 'next/server'

// ─── CAMPOS REUTILIZÁVEIS ──────────────────────────────────────────────────────

// Telefone: aceita formatos internacionais comuns (+33 6 12..., 0612..., etc.)
const campoTelefone = z
  .string()
  .min(6, 'Telefone demasiado curto (mín. 6 dígitos)')
  .max(30, 'Telefone demasiado longo (máx. 30 caracteres)')
  .regex(/^[+\d\s\-().]+$/, 'Formato de telefone inválido (ex: +33 6 12 34 56 78)')

// Cor hexadecimal: #rrggbb
const campoCorHex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida — usa formato hexadecimal (ex: #2563eb)')

// ─── SCHEMAS POR ENDPOINT ─────────────────────────────────────────────────────

// Classificação de pedido pela IA → POST /api/process-pedido
export const schemaProcessarPedido = z.object({
  pedidoId: z.string().min(1, 'pedidoId em falta'),
})

// Formulário público do cliente final → POST /api/pedidos
export const schemaPedido = z.object({
  tenantId: z.string().min(1, 'tenantId em falta'),
  nomeCliente: z
    .string()
    .min(2, 'Nome demasiado curto (mín. 2 caracteres)')
    .max(100, 'Nome demasiado longo (máx. 100 caracteres)'),
  telefoneCliente: campoTelefone,
  // Limite de 2000 caracteres na descrição — evita enviar textos enormes à API Claude
  descricao: z
    .string()
    .min(10, 'Descrição demasiado curta (mín. 10 caracteres)')
    .max(2000, 'Descrição demasiado longa (máx. 2000 caracteres)'),
  fotoUrl: z.string().url('URL da foto inválido').optional(),
})

// Registo de novo artisan → POST /api/auth/registar
export const schemaRegistar = z.object({
  nome: z
    .string()
    .min(2, 'Nome demasiado curto (mín. 2 caracteres)')
    .max(200, 'Nome demasiado longo (máx. 200 caracteres)'),
  email: z.string().email('Formato de email inválido'),
  senha: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .max(100, 'Senha demasiado longa (máx. 100 caracteres)'),
})

// Atualização do perfil do tenant → PATCH /api/tenant
export const schemaTenantUpdate = z.object({
  nome: z
    .string()
    .min(2, 'Nome demasiado curto')
    .max(200, 'Nome demasiado longo (máx. 200 caracteres)')
    .optional(),
  email: z.string().email('Formato de email inválido').optional(),
  telefone: campoTelefone.optional(),
  corPrimaria: campoCorHex.optional(),
  logoUrl: z.string().url('URL do logo inválido').nullable().optional(),
})

// ─── VALIDAÇÃO DE UPLOAD ───────────────────────────────────────────────────────

export const TIPOS_IMAGEM_ACEITES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const TAMANHO_MAX_UPLOAD = 5 * 1024 * 1024 // 5 MB em bytes

// Valida um ficheiro de upload e devolve um erro 400 se inválido, ou null se válido.
// Uso: const erro = validarFicheiroImagem(ficheiro); if (erro) return erro
export function validarFicheiroImagem(ficheiro: File): NextResponse | null {
  if (!TIPOS_IMAGEM_ACEITES.includes(ficheiro.type as (typeof TIPOS_IMAGEM_ACEITES)[number])) {
    return NextResponse.json(
      {
        erro: `Tipo de ficheiro não suportado: "${ficheiro.type}". Aceites: JPG, PNG, WebP.`,
      },
      { status: 400 }
    )
  }

  if (ficheiro.size > TAMANHO_MAX_UPLOAD) {
    const tamanhoMB = (ficheiro.size / 1024 / 1024).toFixed(1)
    return NextResponse.json(
      {
        erro: `Ficheiro demasiado grande (${tamanhoMB} MB). Máximo permitido: 5 MB.`,
      },
      { status: 400 }
    )
  }

  return null // válido
}

// ─── HELPER DE ERRO ZOD ───────────────────────────────────────────────────────

// Converte o erro do zod numa resposta HTTP 400 com a primeira mensagem de erro.
// Evita expor a estrutura interna do schema ao cliente.
export function erroValidacao(error: z.ZodError): NextResponse {
  // Pega na primeira mensagem de erro e inclui o nome do campo se existir
  const primeiro = error.errors[0]
  const campo = primeiro?.path?.join('.') ?? ''
  const mensagem = campo
    ? `${campo}: ${primeiro.message}`
    : (primeiro?.message ?? 'Dados inválidos.')

  return NextResponse.json({ erro: mensagem }, { status: 400 })
}
