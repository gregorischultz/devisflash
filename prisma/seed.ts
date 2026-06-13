// Script de seed — popula a base de dados com dados fictícios para desenvolvimento.
// Corre com: npm run db:seed
// Útil para ter dados reais no ecrã enquanto desenvolvemos a interface.

import { PrismaClient, Plano, Urgencia, StatusPedido } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('A iniciar seed da base de dados...')

  // ─── 1. LIMPAR DADOS ANTIGOS ────────────────────────────────────────────────
  await prisma.pedido.deleteMany()
  await prisma.precoServico.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  console.log('Dados antigos apagados.')

  // ─── 2. CRIAR UTILIZADOR DE TESTE ───────────────────────────────────────────
  // Utilizador para fazer login durante o desenvolvimento
  // Email: martin@test.com | Senha: senha1234
  const senhaHash = await bcrypt.hash('senha1234', 12)

  const utilizador = await prisma.user.create({
    data: {
      name: 'Martin Électricité',
      email: 'martin@test.com',
      password: senhaHash,
    },
  })
  console.log(`Utilizador criado: ${utilizador.email} (senha: senha1234)`)

  // ─── 3. CRIAR TENANT FICTÍCIO ────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      nome: 'Électricité Martin, Tours',
      email: 'martin.electricite@gmail.com',
      telefone: '+33 6 12 34 56 78',
      plano: Plano.BASICO,
      corPrimaria: '#2563eb',
      logoUrl: null,
      // Liga o tenant ao utilizador criado acima
      userId: utilizador.id,
    },
  })
  console.log(`Tenant criado: ${tenant.nome}`)

  // ─── 4. TABELA DE PREÇOS ─────────────────────────────────────────────────────
  const categorias = [
    { categoria: 'tomada_interruptor',    precoMin: 40,   precoMax: 80   },
    { categoria: 'quadro_electrico',      precoMin: 200,  precoMax: 450  },
    { categoria: 'instalacao_luminaria',  precoMin: 60,   precoMax: 120  },
    { categoria: 'curto_circuito_urgente',precoMin: 100,  precoMax: 250  },
    { categoria: 'instalacao_completa',   precoMin: 1500, precoMax: 4000 },
  ]

  await prisma.precoServico.createMany({
    data: categorias.map((c) => ({ tenantId: tenant.id, ...c })),
  })
  console.log(`${categorias.length} categorias de preço criadas.`)

  // ─── 5. PEDIDOS FICTÍCIOS ─────────────────────────────────────────────────────
  const pedidos = [
    // PENDENTES (5) — a IA ainda não processou
    {
      nomeCliente: 'Jean Dupont',
      telefoneCliente: '+33 6 11 22 33 44',
      descricao: "Ma prise de courant dans la cuisine ne fonctionne plus depuis hier soir. J'ai vérifié les disjoncteurs mais tout semble normal. Le reste de la maison fonctionne bien.",
      status: StatusPedido.PENDENTE,
    },
    {
      nomeCliente: 'Marie Laurent',
      telefoneCliente: '+33 6 55 66 77 88',
      descricao: "L'interrupteur du salon fait des étincelles quand je l'actionne. Cela arrive depuis quelques jours. Est-ce dangereux ? Faut-il couper le courant en attendant ?",
      status: StatusPedido.PENDENTE,
    },
    {
      nomeCliente: 'Pierre Moreau',
      telefoneCliente: '+33 6 99 88 77 66',
      descricao: "Je souhaite installer 3 nouvelles prises électriques dans mon bureau à domicile pour mon matériel informatique (2 PC, écrans, imprimante). Le bureau est au premier étage.",
      status: StatusPedido.PENDENTE,
    },
    {
      nomeCliente: 'Sophie Bernard',
      telefoneCliente: '+33 6 44 33 22 11',
      descricao: "Mon tableau électrique est ancien (années 80) et je pense qu'il faut le remettre aux normes. Les disjoncteurs sautent souvent quand j'utilise le four et le lave-linge en même temps.",
      status: StatusPedido.PENDENTE,
    },
    {
      nomeCliente: 'François Petit',
      telefoneCliente: '+33 6 77 55 44 33',
      descricao: "Le plafonnier de ma salle de bain clignote et s'éteint parfois tout seul. Il date de 1995. J'aimerais profiter de l'occasion pour le remplacer par un modèle LED plus moderne.",
      status: StatusPedido.PENDENTE,
    },
    // PROCESSADOS (3) — a IA já preencheu categoria, urgência e preços
    {
      nomeCliente: 'Isabelle Rousseau',
      telefoneCliente: '+33 6 22 11 00 99',
      descricao: "Court-circuit dans le garage, toute l'électricité est coupée depuis ce matin. J'entends un bourdonnement dans le tableau. C'est urgent, j'ai un congélateur plein.",
      status: StatusPedido.PROCESSADO,
      categoria: 'curto_circuito_urgente',
      urgencia: Urgencia.ALTA,
      precoMin: 100,
      precoMax: 250,
      precoEstimado: 150,
    },
    {
      nomeCliente: 'Thomas Girard',
      telefoneCliente: '+33 6 33 44 55 66',
      descricao: "Je voudrais installer un nouveau luminaire suspendu dans ma salle à manger. Le câblage est déjà présent au plafond, il s'agit juste de remplacer l'ancien plafonnier.",
      status: StatusPedido.PROCESSADO,
      categoria: 'instalacao_luminaria',
      urgencia: Urgencia.BAIXA,
      precoMin: 60,
      precoMax: 120,
      precoEstimado: 80,
    },
    {
      nomeCliente: 'Nathalie Martin',
      telefoneCliente: '+33 6 88 77 66 55',
      descricao: "La prise de mon lave-linge a brûlé, il y a des traces noires sur le mur et une odeur de brûlé. J'ai coupé le disjoncteur correspondant. Besoin d'une intervention rapide.",
      status: StatusPedido.PROCESSADO,
      categoria: 'tomada_interruptor',
      urgencia: Urgencia.ALTA,
      precoMin: 40,
      precoMax: 80,
      precoEstimado: 65,
    },
  ]

  for (let i = 0; i < pedidos.length; i++) {
    const p = pedidos[i]
    const diasAtras = pedidos.length - i
    const criadoEm = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000)

    await prisma.pedido.create({
      data: {
        tenantId: tenant.id,
        nomeCliente: p.nomeCliente,
        telefoneCliente: p.telefoneCliente,
        descricao: p.descricao,
        status: p.status,
        categoria: p.categoria ?? null,
        urgencia: p.urgencia ?? null,
        precoMin: p.precoMin ?? null,
        precoMax: p.precoMax ?? null,
        precoEstimado: p.precoEstimado ?? null,
        criadoEm,
      },
    })
  }

  console.log(`${pedidos.length} pedidos criados (5 pendentes, 3 processados).`)
  console.log('\nSeed concluído! Credenciais de teste:')
  console.log('  Email: martin@test.com')
  console.log('  Senha: senha1234')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
