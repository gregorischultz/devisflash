'use client'

// Página de registo — cria uma nova conta de artisan (tenant).
// Usada manualmente no início (fase A) ou via Stripe na fase B.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Registo() {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const form = e.currentTarget
    const nome = (form.elements.namedItem('nome') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const senha = (form.elements.namedItem('senha') as HTMLInputElement).value
    const confirmar = (form.elements.namedItem('confirmar') as HTMLInputElement).value

    // Valida se as senhas coincidem antes de enviar para o servidor
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      setCarregando(false)
      return
    }

    // Envia os dados para a API route que cria o utilizador e o tenant
    const resposta = await fetch('/api/auth/registar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    })

    const dados = await resposta.json()

    if (!resposta.ok) {
      setErro(dados.erro ?? 'Erro ao criar conta. Tenta novamente.')
    } else {
      setSucesso(true)
      // Redireciona para login após 2 segundos
      setTimeout(() => router.push('/login'), 2000)
    }

    setCarregando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md shadow-sm">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">⚡ devisflash</h1>
          <p className="text-gray-500 mt-2 text-sm">Cria a tua conta de artisan</p>
        </div>

        {/* Mensagem de sucesso — aparece depois de criar conta */}
        {sucesso ? (
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <p className="font-semibold text-gray-900">Conta criada com sucesso!</p>
            <p className="text-sm text-gray-500 mt-2">A redirecionar para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do negócio
              </label>
              <input
                name="nome"
                type="text"
                required
                autoComplete="organization"
                placeholder="ex: Électricité Martin"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="email@negocio.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                name="senha"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar senha
              </label>
              <input
                name="confirmar"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repete a senha"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {carregando ? 'A criar conta...' : 'Criar conta'}
            </button>

            {/* Nota sobre o plano inicial */}
            <p className="text-xs text-gray-400 text-center">
              A conta começa no plano Básico (39€/mês). Podes fazer upgrade nas configurações.
            </p>
          </form>
        )}

        {/* Link para login */}
        {!sucesso && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Já tens conta?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
