// Script de seed — popula a base de dados com dados fictícios para desenvolvimento.
// Corre com: npm run db:seed
// Útil para ter dados reais no ecrã enquanto desenvolvemos a interface.

import { PrismaClient, Plano, Urgencia, StatusPedido } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('A iniciar seed da base de dados...')

  // ─── 1. LIMPAR DADOS ANTIGOS ────────────────────────────────────────────────
  // Apaga tudo na ordem correta para respeitar as relações entre tabelas
  await prisma.pedido.deleteMany()
  await prisma.precoServico.deleteMany()
  await prisma.tenant.deleteMany()
  console.log('Dados antigos apagados.')

  // ─── 2. CRIAR TENANT FICTÍCIO ────────────────────────────────────────────────
  // Simula um eletricista real em Tours, França
  const tenant = await prisma.tenant.create({
    data: {
      nome: 'Électricité Martin, Tours',
      email: 'martin.electricite@gmail.com',
      telefone: '+33 6 12 34 56 78',
      plano: Plano.BASICO,
      corPrimaria: '#2563eb',
      logoUrl: null, // Sem logo no plano básico
    },
  })
  console.log(`Tenant criado: ${tenant.nome} (id: ${tenant.id})`)

  // ─── 3. TABELA DE PREÇOS ─────────────────────────────────────────────────────
  // 5 categorias de trabalhos elétricos com faixas de preço realistas (em €)
  const categorias = [
    {
      categoria: 'tomada_interruptor',
      precoMin: 40,
      precoMax: 80,
    },
    {
      categoria: 'quadro_electrico',
      precoMin: 200,
      precoMax: 450,
    },
    {
      categoria: 'instalacao_luminaria',
      precoMin: 60,
      precoMax: 120,
    },
    {
      categoria: 'curto_circuito_urgente',
      precoMin: 100,
      precoMax: 250,
    },
    {
      categoria: 'instalacao_completa',
      precoMin: 1500,
      precoMax: 4000,
    },
  ]

  await prisma.precoServico.createMany({
    data: categorias.map((c) => ({
      tenantId: tenant.id,
      categoria: c.categoria,
      precoMin: c.precoMin,
      precoMax: c.precoMax,
    })),
  })
  console.log(`${categorias.length} categorias de preço criadas.`)

  // ─── 4. PEDIDOS FICTÍCIOS ─────────────────────────────────────────────────────
  // 5 pedidos PENDENTES — chegaram mas a IA ainda não processou
  // 3 pedidos PROCESSADOS — a IA já classificou, estimou urgência e gerou orçamento

  const pedidos = [
    // ── PENDENTES (5) ──────────────────────────────────────────────────────────
    {
      nomeCliente: 'Jean Dupont',
      telefoneCliente: '+33 6 11 22 33 44',
      descricao:
        "Ma prise de courant dans la cuisine ne fonctionne plus depuis hier soir. J'ai vérifié les disjoncteurs mais tout semble normal. Le reste de la maison fonctionne bien.",
      status: StatusPedido.PENDENTE,
    },
    {
      nomeCliente: 'Marie Laurent',
      telefoneCliente: '+33 6 55 66 77 88',
      descricao:
        "L'interrupteur du salon fait des étincelles quand je l'actionne. Cela arrive depuis quelques jours. Est-ce dangereux ? Faut-il couper le courant en attendant ?",
      status: StatusPedido.PENDENTE,
    },
    {
      nomeCliente: 'Pierre Moreau',
      telefoneCliente: '+33 6 99 88 77 66',
      descricao:
        "Je souhaite installer 3 nouvelles prises électriques dans mon bureau à domicile pour mon matériel informatique (2 PC, écrans, imprimante). Le bureau est au premier étage.",
      status: StatusPedido.PENDENTE,
    },
    {
      nomeCliente: 'Sophie Bernard',
      telefoneCliente: '+33 6 44 33 22 11',
      descricao:
        "Mon tableau électrique est ancien (années 80) et je pense qu'il faut le remettre aux normes. Les disjoncteurs sautent souvent quand j'utilise le four et le lave-linge en même temps.",
      status: StatusPedido.PENDENTE,
    },
    {
      nomeCliente: 'François Petit',
      telefoneCliente: '+33 6 77 55 44 33',
      descricao:
        "Le plafonnier de ma salle de bain clignote et s'éteint parfois tout seul. Il date de 1995. J'aimerais profiter de l'occasion pour le remplacer par un modèle LED plus moderne.",
      status: StatusPedido.PENDENTE,
    },

    // ── PROCESSADOS (3) — campos de IA já preenchidos ──────────────────────────
    {
      nomeCliente: 'Isabelle Rousseau',
      telefoneCliente: '+33 6 22 11 00 99',
      descricao:
        "Court-circuit dans le garage, toute l'électricité est coupée depuis ce matin. J'entends un bourdonnement dans le tableau. C'est urgent, j'ai un congélateur plein.",
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
      descricao:
        "Je voudrais installer un nouveau luminaire suspendu dans ma salle à manger. Le câblage est déjà présent au plafond, il s'agit juste de remplacer l'ancien plafonnier.",
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
      descricao:
        "La prise de mon lave-linge a brûlé, il y a des traces noires sur le mur et une odeur de brûlé. J'ai coupé le disjoncteur correspondant. Besoin d'une intervention rapide.",
      status: StatusPedido.PROCESSADO,
      categoria: 'tomada_interruptor',
      urgencia: Urgencia.ALTA,
      precoMin: 40,
      precoMax: 80,
      precoEstimado: 65,
    },
  ]

  // Cria os pedidos um a um (não usamos createMany para poder usar datas diferentes)
  for (let i = 0; i < pedidos.length; i++) {
    const p = pedidos[i]
    // Cria datas escalonadas: o pedido mais antigo tem 7 dias, o mais recente tem 1 hora
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
  console.log('Seed concluído com sucesso!')
}

// Corre a função principal e fecha a conexão à base de dados no final
main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
