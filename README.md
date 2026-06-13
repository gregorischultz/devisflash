# devisflash

Sistema de orçamentos automáticos para artisans — responde a pedidos de clientes em menos de 60 segundos usando IA.

---

## Setup Rápido

### 1. Pré-requisitos

- [Node.js 18+](https://nodejs.org)
- [MySQL](https://dev.mysql.com/downloads/) instalado e a correr localmente
- Chave API da Anthropic → [console.anthropic.com](https://console.anthropic.com)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Abre o ficheiro `.env` e preenche:

```env
DATABASE_URL="mysql://root:a-tua-senha@localhost:3306/devisflash"
ANTHROPIC_API_KEY="sk-ant-..."
# (as variáveis Cloudflare R2 são opcionais para começar a desenvolver)
```

### 4. Criar a base de dados

```bash
# Cria a base de dados "devisflash" no MySQL primeiro:
mysql -u root -p -e "CREATE DATABASE devisflash;"

# Depois aplica o schema do Prisma:
npm run db:push
```

### 5. Iniciar o servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) no browser.

---

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Compila o projeto para produção |
| `npm run start` | Inicia o servidor em modo produção |
| `npm run db:push` | Aplica o schema Prisma à base de dados |
| `npm run db:studio` | Abre o Prisma Studio (interface visual da BD) |
| `npm run db:generate` | Regenera o cliente Prisma após mudanças no schema |

---

## Estrutura do projeto

```
app/              → Páginas (Next.js App Router)
components/       → Componentes React reutilizáveis
lib/              → Utilitários e cliente da base de dados
prisma/           → Schema da base de dados
docs/             → Documentação técnica e de produto
```

Para documentação técnica detalhada, ver [`docs/TECNICO.md`](docs/TECNICO.md).  
Para contexto de produto e pitch, ver [`docs/PITCH.md`](docs/PITCH.md).
