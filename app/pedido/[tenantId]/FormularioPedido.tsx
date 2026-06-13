'use client'

// Formulário de pedido de orçamento — preenchido pelo cliente final.
// Em francês porque o mercado alvo é Tours/França.
// Submete para POST /api/process-pedido e mostra estado de sucesso/erro.

import { useState } from 'react'

interface Props {
  tenantId: string
  corPrimaria: string
}

type EstadoForm = 'inativo' | 'enviando' | 'sucesso' | 'erro' | 'limite'

export default function FormularioPedido({ tenantId, corPrimaria }: Props) {
  const [estado, setEstado] = useState<EstadoForm>('inativo')
  const [mensagemErro, setMensagemErro] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEstado('enviando')
    setMensagemErro('')

    const form = e.currentTarget
    const dados = {
      tenantId,
      nomeCliente: (form.elements.namedItem('nome') as HTMLInputElement).value,
      telefoneCliente: (form.elements.namedItem('telefone') as HTMLInputElement).value,
      descricao: (form.elements.namedItem('descricao') as HTMLTextAreaElement).value,
    }

    try {
      const resposta = await fetch('/api/process-pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })

      const json = await resposta.json()

      if (resposta.status === 429) {
        // Rate limit atingido
        setEstado('limite')
        return
      }

      if (!resposta.ok) {
        setMensagemErro(json.erro ?? 'Une erreur est survenue. Réessayez.')
        setEstado('erro')
        return
      }

      setEstado('sucesso')
    } catch {
      setMensagemErro('Impossible de contacter le serveur. Vérifiez votre connexion.')
      setEstado('erro')
    }
  }

  // ── Ecrã de sucesso ──────────────────────────────────────────────────────
  if (estado === 'sucesso') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Demande envoyée !
        </h2>
        <p className="text-gray-500 text-sm">
          Nous avons bien reçu votre demande. Vous serez contacté très bientôt.
        </p>
      </div>
    )
  }

  // ── Ecrã de rate limit ───────────────────────────────────────────────────
  if (estado === 'limite') {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Trop de demandes
        </h2>
        <p className="text-gray-500 text-sm">
          Trop de demandes. Veuillez réessayer dans une heure.
        </p>
      </div>
    )
  }

  // ── Formulário ───────────────────────────────────────────────────────────
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
          disabled={estado === 'enviando'}
          className="w-full py-3 text-white font-medium rounded-lg text-sm transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: corPrimaria }}
        >
          {estado === 'enviando' ? 'Envoi en cours...' : 'Envoyer ma demande'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Devis gratuit · Réponse sous 1 heure
        </p>
      </form>
    </div>
  )
}
