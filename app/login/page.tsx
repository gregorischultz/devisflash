'use client'

// Página de login — página pública, visível sem autenticação.
// Usa signIn do NextAuth para autenticar com email + senha.

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    // signIn tenta autenticar e devolve um objeto com o resultado
    // redirect: false evita que o NextAuth redirecione automaticamente
    const resultado = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (resultado?.error) {
      setErro('Email ou senha incorretos. Tenta novamente.')
    } else {
      // Login com sucesso — vai para o dashboard
      router.push('/')
      router.refresh()
    }

    setCarregando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md shadow-sm">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">⚡ devisflash</h1>
          <p className="text-gray-500 mt-2 text-sm">Entra na tua conta</p>
        </div>

        {/* Formulário de login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="email@exemplo.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Mensagem de erro — só aparece se o login falhar */}
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
            {carregando ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        {/* Link para criar conta */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Ainda não tens conta?{' '}
          <Link href="/registo" className="text-blue-600 font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
