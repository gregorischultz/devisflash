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

## Autenticação

O sistema usa **NextAuth.js v5 (Auth.js)** com o **Credentials Provider** — login por email e senha.

### Como funciona o login

1. O artisan acede a `/login` e preenche email + senha
2. O NextAuth chama a função `authorize` em `auth.ts`, que:
   - Procura o utilizador na base de dados pelo email
   - Compara a senha enviada com o hash guardado no campo `User.password` usando `bcrypt`
   - Se tudo estiver correto, devolve o utilizador → é criado um JWT (cookie de sessão)
3. O middleware em `middleware.ts` lê o cookie em cada pedido e redireciona para `/login` se não estiver autenticado

### Como a sessão é guardada

Usamos estratégia **JWT** (não database sessions). Isso significa:
- A sessão fica num cookie `httpOnly` encriptado no browser do utilizador
- A base de dados **não** é consultada a cada pedido para validar a sessão (mais rápido)
- O cookie contém: `id`, `email`, `name` e `tenantId` do utilizador

### Como ler a sessão no código

**Em Server Components** (recomendado — não faz pedido extra ao servidor):
```ts
import { auth } from '@/auth'

const session = await auth()
const tenantId = session?.user?.tenantId
```

**Em Client Components** (quando precisas de reatividade):
```ts
import { useSession } from 'next-auth/react'

const { data: session } = useSession()
const tenantId = session?.user?.tenantId
```

### Como adicionar novos artisans

**Opção A — Página de registo (atual):**
1. O artisan acede a `/registo`
2. Preenche nome do negócio, email e senha
3. A API route `/api/auth/registar` cria um `User` (com senha em hash bcrypt) e um `Tenant` ligados

**Opção B — Via script (para criar artisans manualmente em produção):**
```bash
# Temporariamente, usa o seed como base e adapta os dados
npm run db:seed
```

**Opção C — Via Stripe (Fase B):**
Quando o artisan paga via Stripe, o webhook cria o `User` + `Tenant` automaticamente.

### Segurança das senhas

- As senhas são guardadas com **bcrypt** (fator 12) — nunca em texto puro
- Mesmo que a base de dados seja comprometida, as senhas não são recuperáveis
- O `NEXTAUTH_SECRET` encripta os cookies de sessão — gera um novo com `openssl rand -base64 32`

### Ficheiros relevantes

| Ficheiro | O que faz |
|---|---|
| `auth.ts` | Configuração central do NextAuth (providers, callbacks, sessão) |
| `middleware.ts` | Protege rotas — redireciona para /login se não autenticado |
| `app/api/auth/[...nextauth]/route.ts` | Handler das rotas do NextAuth (/api/auth/*) |
| `app/api/auth/registar/route.ts` | API para criar novos utilizadores |
| `app/login/page.tsx` | Página de login |
| `app/registo/page.tsx` | Página de registo de novos artisans |
| `types/next-auth.d.ts` | Extensão dos tipos TypeScript do NextAuth (adiciona `tenantId`) |

---

## Validação de Dados

Todos os endpoints que recebem dados externos usam **zod** para validar o input **antes** de qualquer operação na base de dados ou chamada à API Claude. Isto tem três vantagens:

1. **Economiza tokens de IA** — uma descrição com 10 000 caracteres nunca chega ao Claude
2. **Protege a BD** — tipos errados nunca chegam ao Prisma
3. **Erros claros** — o cliente recebe uma mensagem em português em vez de um crash 500

### Onde estão os schemas

Todos os schemas ficam em `lib/validations.ts` para evitar duplicação:

| Schema | Usado em |
|---|---|
| `schemaPedido` | `POST /api/process-pedido` |
| `schemaRegistar` | `POST /api/auth/registar` |
| `schemaTenantUpdate` | `PATCH /api/tenant` |
| `validarFicheiroImagem()` | `POST /api/upload` |

### Padrão de uso (JSON endpoints)

```ts
import { schemaPedido, erroValidacao } from '@/lib/validations'

// 1. Tenta fazer parse do body (protege contra body malformado)
let body: unknown
try {
  body = await req.json()
} catch {
  return NextResponse.json({ erro: 'Body inválido — esperado JSON.' }, { status: 400 })
}

// 2. Valida com zod — devolve 400 imediatamente se inválido
const resultado = schemaPedido.safeParse(body)
if (!resultado.success) return erroValidacao(resultado.error)

// 3. A partir daqui, resultado.data está garantidamente tipado e válido
const { nomeCliente, descricao, ... } = resultado.data
```

### Padrão de uso (upload de ficheiros)

```ts
import { validarFicheiroImagem } from '@/lib/validations'

const ficheiro = formData.get('ficheiro')
if (!(ficheiro instanceof File)) { /* erro */ }

// Valida tipo (JPG/PNG/WebP) e tamanho (máx. 5 MB) antes do upload para R2
const erro = validarFicheiroImagem(ficheiro)
if (erro) return erro  // devolve 400 com mensagem clara
```

### Limites definidos

| Campo | Limite | Motivo |
|---|---|---|
| `descricao` | máx. 2 000 caracteres | Evita prompts gigantes na API Claude |
| `nome` (cliente/negócio) | máx. 100–200 caracteres | Evita overflow na UI |
| `senha` | mín. 8, máx. 100 caracteres | Segurança mínima + evitar bcrypt lento com strings enormes |
| `telefone` | 6–30 caracteres, só `+`, dígitos, espaços | Formato internacional |
| `corPrimaria` | regex `#rrggbb` | Só cores hexadecimais válidas |
| ficheiro de upload | máx. 5 MB, tipos: JPG/PNG/WebP | Custo de armazenamento + segurança |

---

## Segurança e Isolamento de Dados

### O problema que este mecanismo resolve

O devisflash é multi-tenant: vários artisans partilham a mesma base de dados, mas **cada um só pode ver e editar os seus próprios dados**. Sem proteção explícita, um artisan mal-intencionado poderia tentar aceder aos pedidos de outro mudando um ID na URL.

Exemplo de ataque sem proteção:
```
GET /api/pedidos/clm1234abc   ← ID de um pedido do Tenant B
```
Se a API simplesmente buscasse o pedido pelo ID sem verificar a quem pertence, o Tenant A veria dados do Tenant B.

### Como funciona a proteção

A proteção está em duas camadas:

**Camada 1 — Middleware (`middleware.ts`)**
- Corre antes de qualquer pedido ao servidor
- Rotas protegidas: tudo exceto `/login`, `/registo`, `/pedido/*`, `/api/auth/*`, `/api/process-pedido`, `/api/upload`
- Se não há sessão: devolve `401` para APIs, redireciona para `/login` para páginas

**Camada 2 — Helpers de autorização (`lib/auth.ts`)**
- Cada API route protegida verifica o `tenantId` da sessão antes de aceder à BD
- **Regra de ouro: nunca confiar no `tenantId` vindo do URL ou do body — usar sempre o da sessão**

### As duas funções principais

**`exigirTenantAutenticado()`** — para endpoints que listam ou criam recursos:
```ts
import { exigirTenantAutenticado } from '@/lib/auth'

export async function GET() {
  const { tenantId, erro } = await exigirTenantAutenticado()
  if (erro) return erro  // devolve 401 se não autenticado

  // tenantId é string garantida a partir daqui
  const pedidos = await prisma.pedido.findMany({
    where: { tenantId },  // filtra SEMPRE pelo tenant da sessão
  })
  return NextResponse.json(pedidos)
}
```

**`verificarAcessoTenant(tenantIdDoRecurso)`** — para endpoints que acedem a um recurso por ID:
```ts
import { verificarAcessoTenant } from '@/lib/auth'

export async function GET(req, { params }) {
  const pedido = await prisma.pedido.findUnique({ where: { id: params.id } })
  if (!pedido) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 })

  // Compara o tenantId do pedido com o da sessão
  const { autorizado, erro } = await verificarAcessoTenant(pedido.tenantId)
  if (!autorizado) return erro  // devolve 403 se for de outro tenant

  return NextResponse.json(pedido)
}
```

### Mapa de rotas públicas vs. protegidas

| Rota | Pública? | Motivo |
|---|---|---|
| `/login`, `/registo` | Sim | Páginas de autenticação |
| `/pedido/[tenantId]` | Sim | Formulário que o artisan partilha com os seus clientes |
| `/api/auth/*` | Sim | Rotas internas do NextAuth |
| `/api/process-pedido` | Sim | Chamada pelo formulário público (sem login) |
| `/api/upload` | Sim | Upload de fotos pelos clientes finais |
| Todo o resto | **Não** | Requer sessão válida + validação de tenant |

### Fluxo de segurança num pedido típico

```
Cliente faz GET /api/pedidos/xyz
        ↓
Middleware verifica sessão
  → sem sessão: devolve 401
  → com sessão: continua
        ↓
API route busca pedido na BD pelo ID
        ↓
verificarAcessoTenant(pedido.tenantId)
  → pedido.tenantId ≠ sessão.tenantId: devolve 403
  → correspondem: devolve os dados
```

---

## Decisões Técnicas

> *Esta secção será preenchida ao longo do projecto, documentando as escolhas importantes e o raciocínio por trás delas.*
