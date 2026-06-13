# Documentação Técnica — devisflash

## Visão Geral

O devisflash é um sistema SaaS que permite a artisans (eletricistas, encanadores, pintores, etc.) receber pedidos de orçamento e responder automaticamente em segundos, usando inteligência artificial. O cliente final envia uma foto e descrição do problema; o sistema classifica, estima o preço e responde sem intervenção humana.

---

## Stack Técnico

| Camada | Tecnologia | Porquê |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, API Routes e componentes React num só projeto |
| Linguagem | TypeScript | Evita erros de tipo e melhora o autocompletar |
| Estilos | Tailwind CSS | Desenvolvimento rápido sem escrever CSS manual |
| Base de dados | MySQL via Prisma ORM | Prisma facilita as queries e gera tipos TypeScript automaticamente |
| IA | Anthropic Claude API | Classificação de pedidos, estimativa de urgência e geração de orçamentos |
| Armazenamento de ficheiros | Cloudflare R2 | Guardar fotos enviadas pelos clientes (alternativa barata ao S3) |
| Hosting | A definir | Vercel ou VPS |

---

## Como Rodar Localmente

### Pré-requisitos
- Node.js 18 ou superior
- MySQL instalado e a correr
- Conta Anthropic (para a chave API)
- Conta Cloudflare com R2 activo (opcional para desenvolvimento inicial)

### Passo a passo

```bash
# 1. Clona o repositório
git clone <url-do-repo>
cd devisflash

# 2. Instala as dependências
npm install

# 3. Copia o ficheiro de variáveis de ambiente
cp .env.example .env

# 4. Preenche o ficheiro .env com os teus valores reais
# (abre .env e preenche DATABASE_URL, ANTHROPIC_API_KEY, etc.)

# 5. Cria as tabelas na base de dados
npm run db:push

# 6. (Opcional) Abre o Prisma Studio para ver a base de dados visualmente
npm run db:studio

# 7. Inicia o servidor de desenvolvimento
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) no browser.

---

## Estrutura de Pastas

```
devisflash/
├── app/                    # Páginas da aplicação (Next.js App Router)
│   ├── layout.tsx          # Layout raiz com sidebar
│   ├── page.tsx            # Dashboard principal
│   ├── pedidos/            # Página de lista de pedidos
│   ├── estatisticas/       # Página de estatísticas
│   └── configuracoes/      # Página de configurações
│
├── components/             # Componentes React reutilizáveis
│   └── Sidebar.tsx         # Menu lateral de navegação
│
├── lib/                    # Código utilitário e configurações
│   ├── prisma.ts           # Cliente da base de dados
│   └── utils.ts            # Funções auxiliares (formatar preço, data, etc.)
│
├── prisma/                 # Configuração da base de dados
│   └── schema.prisma       # Definição das tabelas (Artisan, Pedido)
│
├── docs/                   # Documentação do projecto
│   ├── TECNICO.md          # Este ficheiro
│   └── PITCH.md            # Proposta de valor e planos
│
├── .env.example            # Exemplo de variáveis de ambiente
└── README.md               # Instruções de setup rápido
```

---

## Decisões Técnicas

> *Esta secção será preenchida ao longo do projecto, documentando as escolhas importantes e o raciocínio por trás delas.*
