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
│   ├── schema.prisma       # Definição das tabelas e enums
│   └── seed.ts             # Script para popular a BD com dados fictícios
│
├── docs/                   # Documentação do projecto
│   ├── TECNICO.md          # Este ficheiro
│   └── PITCH.md            # Proposta de valor e planos
│
├── .env.example            # Exemplo de variáveis de ambiente
└── README.md               # Instruções de setup rápido
```

---

## Modelo de Dados

O sistema tem três tabelas principais. Abaixo explicamos o que cada uma guarda e para que serve.

### `tenants` — Os Artisans

O **Tenant** é o artisan que tem uma conta no sistema. O nome "tenant" é um termo técnico para "cliente de um SaaS" — é o eletricista, o encanador, o pintor. Não confundir com o cliente final (que faz o pedido).

| Campo | Tipo | Para que serve |
|---|---|---|
| `id` | String (cuid) | Identificador único gerado automaticamente |
| `nome` | String | Nome do negócio (ex: "Électricité Martin") |
| `email` | String | Email de login, tem de ser único |
| `telefone` | String? | Número de contacto (opcional) |
| `plano` | Enum `Plano` | `BASICO` (39€/mês) ou `PRO` (79€/mês) |
| `corPrimaria` | String | Cor da marca em hexadecimal (ex: `#2563eb`) |
| `logoUrl` | String? | URL do logo guardado no R2 (só plano PRO) |
| `criadoEm` | DateTime | Data de registo no sistema |

---

### `precos_servico` — A Tabela de Preços do Artisan

O **PrecoServico** guarda quanto o artisan cobra por cada tipo de trabalho. É esta tabela que a IA consulta para gerar os pré-orçamentos. Cada artisan tem a sua própria tabela de preços — dois eletricistas podem cobrar valores diferentes pela mesma categoria.

| Campo | Tipo | Para que serve |
|---|---|---|
| `id` | String (cuid) | Identificador único |
| `tenantId` | String | Chave estrangeira — a que artisan pertence este preço |
| `categoria` | String | Tipo de trabalho (ex: `"tomada_interruptor"`, `"quadro_electrico"`) |
| `precoMin` | Decimal | Valor mínimo cobrado por este tipo de trabalho (€) |
| `precoMax` | Decimal | Valor máximo cobrado por este tipo de trabalho (€) |
| `criadoEm` | DateTime | Data de criação do registo |

Categorias actuais: `tomada_interruptor`, `quadro_electrico`, `instalacao_luminaria`, `curto_circuito_urgente`, `instalacao_completa`.

---

### `pedidos` — Os Pedidos dos Clientes Finais

O **Pedido** é criado quando um cliente final (o dono de casa, o gestor do escritório) pede um orçamento. Começa com apenas a descrição e/ou foto. A IA preenche os campos de classificação (`categoria`, `urgencia`, `precoEstimado`) automaticamente.

| Campo | Tipo | Para que serve |
|---|---|---|
| `id` | String (cuid) | Identificador único |
| `tenantId` | String | A que artisan pertence este pedido |
| `nomeCliente` | String | Nome do cliente que pediu o orçamento |
| `telefoneCliente` | String | Contacto do cliente para o artisan confirmar |
| `descricao` | Text | Descrição do problema em texto livre |
| `fotoUrl` | String? | URL da foto enviada, guardada no Cloudflare R2 |
| `categoria` | String? | Preenchido pela IA: que tipo de trabalho é este? |
| `urgencia` | Enum `Urgencia`? | Preenchido pela IA: `BAIXA`, `MEDIA` ou `ALTA` |
| `precoMin` | Decimal? | Faixa mínima do orçamento, vem da tabela de preços |
| `precoMax` | Decimal? | Faixa máxima do orçamento, vem da tabela de preços |
| `precoEstimado` | Decimal? | Valor pontual estimado pela IA dentro da faixa |
| `status` | Enum `StatusPedido` | Estado actual do pedido (ver abaixo) |
| `criadoEm` | DateTime | Quando o pedido chegou |
| `atualizadoEm` | DateTime | Última vez que o pedido foi modificado |

**Ciclo de vida de um pedido:**

```
PENDENTE → PROCESSADO → CONFIRMADO
                    ↘ CANCELADO
```

- `PENDENTE` — chegou, aguarda processamento pela IA
- `PROCESSADO` — a IA classificou, estimou urgência e gerou orçamento
- `CONFIRMADO` — o artisan confirmou o agendamento com o cliente
- `CANCELADO` — o trabalho não vai avançar (cliente desistiu, fora da área, etc.)

---

## Decisões Técnicas

> *Esta secção será preenchida ao longo do projecto, documentando as escolhas importantes e o raciocínio por trás delas.*
