// Endpoint público de upload de imagens — chamado pelo formulário do cliente final.
// Recebe um ficheiro via FormData, valida tipo e tamanho, e guarda no Cloudflare R2.
//
// Por que é público: o cliente final faz o upload ANTES de submeter o formulário,
// sem ter uma conta no sistema.

import { NextResponse } from 'next/server'
import { validarFicheiroImagem } from '@/lib/validations'

export async function POST(req: Request) {
  // ── 1. Ler o FormData ───────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { erro: 'Pedido inválido — esperado FormData com campo "ficheiro".' },
      { status: 400 }
    )
  }

  const ficheiro = formData.get('ficheiro')

  if (!ficheiro || !(ficheiro instanceof File)) {
    return NextResponse.json(
      { erro: 'Campo "ficheiro" em falta ou inválido.' },
      { status: 400 }
    )
  }

  // ── 2. Validar tipo e tamanho (antes de qualquer upload) ────────────────────
  // Esta validação corre ANTES de enviar qualquer byte para o Cloudflare R2.
  const erroFicheiro = validarFicheiroImagem(ficheiro)
  if (erroFicheiro) return erroFicheiro

  // ── 3. Upload para Cloudflare R2 ────────────────────────────────────────────
  // [TODO: Fase A] Implementar upload real para R2 com o SDK da Cloudflare.
  // O código abaixo é um stub que simula o retorno de uma URL pública.
  //
  // Implementação futura:
  //   import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
  //   const r2 = new S3Client({ ... }) // credenciais do .env
  //   const nomeUnico = `${Date.now()}-${ficheiro.name}`
  //   await r2.send(new PutObjectCommand({ Bucket: ..., Key: nomeUnico, Body: ... }))
  //   const url = `https://<account>.r2.cloudflarestorage.com/${nomeUnico}`

  const nomeUnico = `${Date.now()}-${ficheiro.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
  const urlSimulada = `/uploads/${nomeUnico}` // substituir pela URL real do R2

  return NextResponse.json(
    {
      sucesso: true,
      url: urlSimulada,
      nome: ficheiro.name,
      tamanho: ficheiro.size,
      tipo: ficheiro.type,
    },
    { status: 201 }
  )
}
