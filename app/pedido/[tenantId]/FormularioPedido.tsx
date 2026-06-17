'use client'

// Formulário de pedido de orçamento — preenchido pelo cliente final.
// Em francês porque o mercado alvo é Tours/França.
//
// Fluxo de 2 passos (transparente para o utilizador):
//   1. POST /api/pedidos     → cria o pedido, devolve pedidoId
//   2. POST /api/process-pedido → IA classifica e gera resposta em francês
// O cliente vê apenas um botão e a resposta final da IA.

import { useState } from 'react'

interface Props {
  tenantId: string
  corPrimaria: string
}

type EstadoForm = 'inativo' | 'enviando' | 'processando' | 'sucesso' | 'erro' | 'limite'

export default function FormularioPedido({ tenantId, corPrimaria }: Props) {
  const [estado, setEstado] = useState<EstadoForm>('inativo')
  const [mensagemErro, setMensagemErro] = useState('')
  const [respostaIA, setRespostaIA] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEstado('enviando')
    setMensagemErro('')
    setRespostaIA('')

    const form = e.currentTarget
    const dados = {
      tenantId,
      nomeCliente: (form.elements.namedItem('nome') as HTMLInputElement).value,
      telefoneCliente: (form.elements.namedItem('telefone') as HTMLInputElement).value,
      descricao: (form.elements.namedItem('descricao') as HTMLTextAreaElement).value,
    }

    try {
      // ── Passo 1: Criar o pedido ───────────────────────────────────────────
      const respostaCriacao = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })

      const jsonCriacao = await respostaCriacao.json()

      if (respostaCriacao.status === 429) {
        setEstado('limite')
        return
      }

      if (!respostaCriacao.ok) {
        setMensagemErro(jsonCriacao.erro ?? 'Une erreur est survenue. Réessayez.')
        setEstado('erro')
        return
      }

      // ── Passo 2: Classificar com IA ───────────────────────────────────────
      setEstado('processando')

      const respostaIA = await fetch('/api/process-pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId: jsonCriacao.pedidoId }),
      })

      const jsonIA = await respostaIA.json()

      if (respostaIA.status === 429) {
        setEstado('limite')
        return
      }

      if (!respostaIA.ok) {
        // A IA falhou mas o pedido foi criado — mostra sucesso simples sem resposta IA
        setEstado('sucesso')
        return
      }

      // Guarda a resposta da IA para mostrar ao cliente
      setRespostaIA(jsonIA.pedido?.respostaIA ?? '')
      setEstado('sucesso')
    } catch {
      setMensagemErro('Impossible de contacter le serveur. Vérifiez votre connexion.')
      setEstado('erro')
    }
  }

  // ── Ecrã de sucesso ──────────────────────────────────────────────────────
  if (estado === 'sucesso') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-4">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
        </div>

        {respostaIA ? (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800 mb-1">Réponse de l&apos;artisan :</p>
            <p className="text-sm text-blue-900">{respostaIA}</p>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm">
            Nous avons bien reçu votre demande. Vous serez contacté très bientôt.
          </p>
        )}
      </div>
    )
  }

  // ── Ecrã de rate limit ───────────────────────────────────────────────────
  if (estado === 'limite') {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Trop de demandes</h2>
        <p className="text-gray-500 text-sm">
          Trop de demandes. Veuillez réessayer dans une heure.
        </p>
      </div>
    )
  }

  // ── Formulário ───────────────────────────────────────────────────────────
  const estaAProcessar = estado === 'enviando' || estado === 'processando'
  const textosBotao = {
    inativo: 'Envoyer ma demande',
    enviando: 'Envoi en cours...',
    processando: 'Analyse en cours...',
    erro: 'Envoyer ma demande',
    sucesso: 'Envoyer ma demande',
    limite: 'Envoyer ma demande',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Décrivez votre problème</h2>
        <p className="text-sm text-gray-500 mt-1">
          Remplissez le formulaire ci-dessous. Nous vous répondons rapidement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Votre nom <span className="text-red-500">*</span>
          </label>
          <input
            name="nome"
            type="text"
            required
            autoComplete="name"
            placeholder="Jean Dupont"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
            style={{ '--tw-ring-color': corPrimaria } as React.CSSProperties}
          />
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone <span className="text-red-500">*</span>
          </label>
          <input
            name="telefone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+33 6 12 34 56 78"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
          />
        </div>

        {/* Descrição do problema */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description du problème <span className="text-red-500">*</span>
          </label>
          <textarea
            name="descricao"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            placeholder="Décrivez le problème en détail : où se trouve-t-il, depuis quand, ce que vous avez observé..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">Maximum 2 000 caractères</p>
        </div>

        {/* Mensagem de erro */}
        {estado === 'erro' && mensagemErro && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
            {mensagemErro}
          </div>
        )}

        {/* Botão de envio */}
        <button
          type="submit"
          disabled={estaAProcessar}
          className="w-full py-3 text-white font-medium rounded-lg text-sm transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: corPrimaria }}
        >
          {textosBotao[estado]}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Devis gratuit · Réponse sous 1 heure
        </p>
      </form>
    </div>
  )
}
