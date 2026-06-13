# Checklist de Segurança — devisflash

Percorre esta lista antes de cada deploy importante (produção, beta, demo com clientes).  
Marca cada item com ✅ quando verificado, ⚠️ se há ressalva, ou ❌ se está por resolver.

---

## 1. Segredos e Variáveis de Ambiente

| # | Verificação | Estado | Notas |
|---|---|---|---|
| 1.1 | `.env` está no `.gitignore` | ✅ | Verificado — linha `.env` presente |
| 1.2 | `.env.local` está no `.gitignore` | ✅ | Verificado — linha `.env.local` presente |
| 1.3 | `.env.production` e `.env.development` estão no `.gitignore` | ✅ | Linhas `*.local` cobrem variantes |
| 1.4 | Nenhum ficheiro `.env` real está tracked pelo `git ls-files` | ✅ | Só `.env.example` é tracked |
| 1.5 | `NEXTAUTH_SECRET` gerado com `openssl rand -base64 32` e diferente entre ambientes | ⬜ | Verificar antes do primeiro deploy em produção |
| 1.6 | Chaves de Anthropic, Cloudflare R2 e DB são diferentes entre dev e produção | ⬜ | Criar contas/projetos separados para produção |
| 1.7 | Nenhuma chave de API hardcoded no código (`grep -r "sk-ant-" .`) | ✅ | Auditado — nenhum resultado |
| 1.8 | Nenhum token/secret hardcoded (padrões base64 longos, Bearer tokens) | ✅ | Auditado — nenhum resultado |
| 1.9 | `process.env` não é usado em ficheiros com `'use client'` (exporia vars ao browser) | ✅ | Auditado — nenhum resultado em `app/` |
| 1.10 | Variáveis de ambiente públicas (expostas ao browser) prefixadas com `NEXT_PUBLIC_` apenas quando intencional | ✅ | Não existe nenhuma `NEXT_PUBLIC_` atualmente |

**Como re-verificar:**
```bash
# Nenhum .env tracked
git ls-files | grep "^\.env"

# Nenhuma chave hardcoded
grep -rn --include="*.ts" --include="*.tsx" --exclude-dir=node_modules \
  -E "(sk-ant-|AKIA|AIza|ghp_|Bearer [A-Za-z0-9]{30,})" .

# Nenhum process.env em client components
grep -rn "process\.env\." --include="*.tsx" app/
```

---

## 2. Respostas da API — Campos Expostos ao Frontend

| # | Endpoint | Campos devolvidos | Estado | Campos sensíveis excluídos |
|---|---|---|---|---|
| 2.1 | `GET /api/tenant` | `id, nome, email, telefone, plano, corPrimaria, logoUrl, criadoEm` | ✅ | `password`, `userId`, `stripeCustomerId` |
| 2.2 | `PATCH /api/tenant` | `id, nome, email, telefone, plano, corPrimaria, logoUrl` | ✅ | `password`, `userId`, `stripeCustomerId` |
| 2.3 | `POST /api/process-pedido` | `sucesso, mensagem, pedidoId` | ✅ | Sem dados do tenant ou user |
| 2.4 | `POST /api/upload` | `sucesso, url, nome, tamanho, tipo` | ✅ | Sem dados internos |
| 2.5 | `POST /api/auth/registar` | `sucesso: true` | ✅ | Sem dados do user criado |
| 2.6 | Sessão JWT (cookie) | `id, email, name, tenantId` | ✅ | `password` nunca entra no JWT |
| 2.7 | Função `authorize` em `auth.ts` usa `select` explícito | ✅ | Carrega só `id, name, email, password, tenant.id` |

**Regra a seguir ao adicionar novos endpoints:**
- Usar sempre `select: { campo: true }` nas queries Prisma — nunca devolver o objeto completo
- Campos a NUNCA expor: `password`, `userId` (FK interna), `stripeCustomerId`, `stripeSubscriptionId`, qualquer campo terminado em `Secret` ou `Token`

---

## 3. Autenticação e Autorização

| # | Verificação | Estado | Notas |
|---|---|---|---|
| 3.1 | Todas as rotas de dashboard protegidas pelo middleware | ✅ | `middleware.ts` cobre tudo exceto lista de exceções |
| 3.2 | Rotas públicas listadas explicitamente no middleware | ✅ | `/login`, `/registo`, `/pedido/*`, `/api/auth/*`, `/api/process-pedido`, `/api/upload` |
| 3.3 | API routes protegidas devolvem `401` (não redirect) | ✅ | Middleware distingue `/api/*` de páginas |
| 3.4 | `exigirTenantAutenticado()` usado em todos os endpoints protegidos | ✅ | `GET /api/tenant`, `PATCH /api/tenant` |
| 3.5 | `verificarAcessoTenant()` usado ao aceder a recursos por ID | ⬜ | Implementar quando adicionares `GET /api/pedidos/[id]` |
| 3.6 | `tenantId` vem sempre da sessão, nunca do URL/body em endpoints protegidos | ✅ | Padrão seguido em todos os endpoints |
| 3.7 | Passwords guardadas com bcrypt fator 12 | ✅ | `bcrypt.hash(senha, 12)` em `registar/route.ts` |
| 3.8 | Nenhuma password em logs ou respostas de erro | ✅ | Auditado — nenhuma referência em NextResponse |

---

## 4. Rate Limiting

| # | Verificação | Estado | Notas |
|---|---|---|---|
| 4.1 | `POST /api/process-pedido` tem rate limiting | ✅ | 5 req/hora/IP — step 0 antes de validação |
| 4.2 | Página `/pedido/[tenantId]` tem rate limiting | ✅ | 5 req/hora/IP — Server Component |
| 4.3 | Rate limit devolvido como `429` com `Retry-After: 3600` | ✅ | Headers corretos configurados |
| 4.4 | Mensagem de limite em francês (idioma do utilizador final) | ✅ | `"Trop de demandes. Veuillez réessayer dans une heure."` |
| 4.5 | Tabela `rate_limits` tem índice composto `(ip, endpoint, criadoEm)` | ✅ | `@@index` no schema.prisma |
| 4.6 | IP extraído de `x-forwarded-for` (correto atrás de proxy/Vercel) | ✅ | `extrairIpDoRequest()` e `extrairIpDosHeaders()` |

---

## 5. Validação de Input

| # | Verificação | Estado | Notas |
|---|---|---|---|
| 5.1 | Todos os endpoints com input externo validam com zod | ✅ | `registar`, `process-pedido`, `tenant PATCH` |
| 5.2 | Validação ocorre ANTES de qualquer operação na BD ou chamada à API Claude | ✅ | Padrão seguido — ver ordem nos route handlers |
| 5.3 | `descricao` limitada a 2 000 caracteres (evita abuso da API Claude) | ✅ | `schemaPedido` em `lib/validations.ts` |
| 5.4 | Upload de ficheiros valida tipo (JPG/PNG/WebP) e tamanho (máx. 5 MB) | ✅ | `validarFicheiroImagem()` em `lib/validations.ts` |
| 5.5 | Erros de validação devolvem `400` com mensagem clara | ✅ | `erroValidacao()` devolve primeira mensagem do zod |
| 5.6 | Body malformado (não-JSON) tratado com try/catch antes do safeParse | ✅ | Padrão `try { body = await req.json() }` |

---

## 6. Dependências

| # | Verificação | Estado | Notas |
|---|---|---|---|
| 6.1 | `npm audit` sem vulnerabilidades críticas | ⬜ | Correr antes do deploy: `npm audit` |
| 6.2 | Dependências atualizadas (sem versões muito antigas) | ⬜ | `npm outdated` para verificar |
| 6.3 | Sem dependências desnecessárias com acesso a filesystem ou rede | ⬜ | Rever `package.json` antes do deploy |

---

## 7. Configuração de Produção

| # | Verificação | Estado | Notas |
|---|---|---|---|
| 7.1 | `NEXTAUTH_URL` aponta para o domínio de produção (não localhost) | ⬜ | Atualizar no `.env` de produção |
| 7.2 | `NODE_ENV=production` no ambiente de deploy | ⬜ | Vercel/VPS configura automaticamente |
| 7.3 | Logs de query Prisma desativados em produção | ⬜ | `lib/prisma.ts` usa `log: ['query']` — remover em produção |
| 7.4 | Headers de segurança HTTP configurados (`X-Frame-Options`, `CSP`, etc.) | ⬜ | Adicionar em `next.config.js` antes do beta |
| 7.5 | HTTPS obrigatório (sem HTTP em produção) | ⬜ | Garantir que o host redireciona HTTP → HTTPS |

---

## 8. Dados de Teste

| # | Verificação | Estado | Notas |
|---|---|---|---|
| 8.1 | Dados do `prisma/seed.ts` removidos em produção (ou seed nunca corre em prod) | ⬜ | `npm run db:seed` só em dev — documentar no deploy guide |
| 8.2 | Utilizador de teste `martin@test.com` / `senha1234` não existe em produção | ⬜ | Verificar após deploy |
| 8.3 | Senha hardcoded no `seed.ts` (`senha1234`) é óbvia e aceitável só em dev | ✅ | Seed só para desenvolvimento local |

---

## Como usar esta checklist

1. Antes de um deploy, duplica esta lista e marca cada item
2. Itens ⬜ (por verificar) são os que precisam de atenção
3. Itens ✅ já foram auditados no código — re-verifica se houve mudanças desde a última vez
4. Qualquer ❌ bloqueia o deploy até ser resolvido

**Comandos de auditoria rápida:**
```bash
# Segredos hardcoded
grep -rn --include="*.ts" --include="*.tsx" --exclude-dir=node_modules \
  -E "(sk-ant-|sk-|AKIA|Bearer [A-Za-z0-9]{30,})" .

# .env files tracked pelo git
git ls-files | grep "^\.env"

# process.env em client components
grep -rn "process\.env\." --include="*.tsx" app/

# Vulnerabilidades de dependências
npm audit

# Queries Prisma sem select (possível fuga de dados)
grep -rn "findUnique\|findMany\|findFirst" --include="*.ts" app/api/ \
  | grep -v "select:"
```
