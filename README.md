# ObraJá 2.0

Marketplace híbrido **B2B/B2C multi-vendedor** para materiais de construção civil, inspirado no modelo iFood. Conecta fábricas, lojas de materiais, construtoras e consumidores finais em um ecossistema unificado com logística própria.

**Modelo de negócio:** fornecedores pagam comissão por venda; a plataforma gerencia catálogo, pagamentos, NF-e e logística.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Web (marketplace) | Next.js 15 App Router + TailwindCSS |
| Web (admin) | Next.js 15 App Router + TailwindCSS |
| Web (fornecedor) | Next.js 15 App Router + TailwindCSS |
| API | NestJS + TypeScript strict |
| ORM | Prisma 5 |
| Banco de dados | PostgreSQL 16 |
| Cache / Filas | Redis 7 + BullMQ |
| Auth | JWT + Refresh Token (HttpOnly cookie) + Argon2 |
| Storage | Cloudflare R2 (compatível S3) |
| Pagamentos | Asaas (PIX, boleto, cartão + split) |
| NF-e | Focus NFe |
| WebSocket | Socket.io |
| Testes E2E | Playwright |

---

## Estrutura do Monorepo

```
obraja-2.0/
├── apps/
│   ├── web-marketplace/     # Next.js — vitrine + carrinho + checkout  :3000
│   ├── web-admin/           # Next.js — painel administrativo          :3002
│   └── web-supplier/        # Next.js — painel do fornecedor           :3003
├── packages/
│   ├── api/                 # NestJS — API principal                   :3001
│   ├── database/            # Prisma schema + seed + migrations
│   ├── types/               # Tipos TypeScript compartilhados
│   └── config/              # TSConfig base
├── tests/
│   ├── marketplace/         # Testes E2E do marketplace
│   └── supplier/            # Testes E2E do painel do fornecedor
├── docker-compose.yml       # PostgreSQL + Redis + Adminer (dev local)
├── playwright.config.ts
└── .env.example
```

---

## Pré-requisitos

- Node.js >= 20
- pnpm >= 9 — `npm install -g pnpm`
- Docker Desktop (para PostgreSQL e Redis locais)

---

## Instalação e setup

```bash
# 1. Clonar o repositório
git clone https://github.com/diogovarelarepresentacoes-eng/obraja-2.0.git
cd obraja-2.0

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example packages/api/.env
# Edite packages/api/.env com suas chaves

# 4. Subir banco de dados e Redis
docker compose up -d

# 5. Rodar migrations e seed
pnpm db:migrate
pnpm db:seed

# 6. Iniciar todos os serviços em desenvolvimento
pnpm dev
```

### Serviços disponíveis após `pnpm dev`

| Serviço | URL |
|---------|-----|
| Marketplace | http://localhost:3000 |
| API NestJS | http://localhost:3001 |
| Admin | http://localhost:3002 |
| Painel Fornecedor | http://localhost:3003 |
| Adminer (DB UI) | http://localhost:8080 |
| Swagger (API docs) | http://localhost:3001/api/docs |

---

## Docker Compose

O `docker-compose.yml` sobe a infraestrutura necessária para desenvolvimento local:

```bash
docker compose up -d      # Sobe PostgreSQL, Redis e Adminer
docker compose down       # Para os serviços
docker compose logs -f    # Acompanha os logs
```

| Serviço | Porta | Credenciais (dev) |
|---------|-------|-------------------|
| PostgreSQL 16 | 5432 | user: `obraja` / pass: `obraja123` / db: `obraja2` |
| Redis 7 | 6379 | sem autenticação |
| Adminer | 8080 | usa credenciais do PostgreSQL |

> Em produção, use serviços gerenciados (ex: Railway, Supabase, Upstash Redis) e configure as variáveis de ambiente adequadamente.

---

## Variáveis de Ambiente

Copie `.env.example` para `packages/api/.env` e preencha:

```env
# Banco de dados
DATABASE_URL=postgresql://obraja:obraja123@localhost:5432/obraja2

# JWT
JWT_SECRET=seu_secret_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Pagamentos (Asaas)
ASAAS_API_KEY=
ASAAS_ENVIRONMENT=sandbox

# Nota Fiscal (Focus NFe)
FOCUS_NFE_TOKEN=
FOCUS_NFE_ENVIRONMENT=homologacao

# Storage (Cloudflare R2)
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_ENDPOINT=

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@obraja.com.br

# Redis
REDIS_URL=redis://localhost:6379

# Firebase Push
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

---

## Módulos da API

Base URL: `http://localhost:3001/api/v1`

| Módulo | Prefixo | Roles permitidas |
|--------|---------|-----------------|
| Auth | `/auth` | Público |
| Users | `/users` | Autenticado |
| Approvals | `/approvals` | ADMIN |
| Suppliers | `/suppliers` | ADMIN, SUPPLIER_* |
| Products | `/products` | Público (leitura), SUPPLIER_* (escrita) |
| Categories | `/categories` | Público (leitura), ADMIN (escrita) |
| Cart | `/cart` | Público (sessão), autenticado |
| Orders | `/orders` | BUYER, CONTRACTOR, SUPPLIER_*, ADMIN |
| Payments | `/payments` | ADMIN (webhook) |
| Delivery | `/delivery` | DRIVER, ADMIN |
| Documents | `/documents` | Público (upload pending), ADMIN |
| Notifications | `/notifications` | Autenticado |

---

## Roles e Permissões (RBAC)

| Role | Acesso |
|------|--------|
| `ADMIN` | Tudo — aprovações, usuários, configurações, relatórios |
| `SUPPLIER_STORE` | Painel próprio — produtos, estoque, pedidos, frete |
| `SUPPLIER_FACTORY` | Painel próprio — produtos, MOQ, tabelas de preço B2B |
| `CONTRACTOR` | Marketplace B2B — preços atacado, prazo, NF-e, crédito |
| `BUYER` | Marketplace B2C — catálogo, carrinho, pedidos |
| `DRIVER` | App entregador — aceitar, rastrear, concluir entregas |

---

## Fluxos Principais

### Onboarding de Fornecedor
```
Cadastro (CNPJ + docs) → PENDING_REVIEW → Admin aprova → acesso ao painel
```

### Compra B2C
```
Catálogo → Carrinho único → Checkout (PIX/cartão) → Split por fornecedor → Entrega
```

### Compra B2B (Construtoras)
```
Aprovação cadastro → preços atacado + MOQ → checkout com prazo → NF-e automática
```

### Cadastro de Entregador
```
Formulário (CPF + CNH + veículo) → Upload docs → PENDING_REVIEW → Admin aprova → corridas
```

---

## Banco de Dados

O schema Prisma contém 20 modelos:

`User` · `SupplierProfile` · `SupplierAddress` · `ContractorProfile` · `BuyerProfile` · `DriverProfile` · `Document` · `Category` · `Product` · `ProductImage` · `Cart` · `CartItem` · `Order` · `SubOrder` · `SubOrderItem` · `Delivery` · `DeliveryTracking` · `RefreshToken` · `ContractorAddress` · `BuyerAddress`

```bash
pnpm db:generate    # Gera tipos Prisma
pnpm db:migrate     # Roda migrations em dev
pnpm db:push        # Push direto ao schema (sem migration)
pnpm db:seed        # Popula dados iniciais
pnpm db:studio      # Abre Prisma Studio (UI do banco)
```

---

## Testes

```bash
# Rodar toda a suite E2E (44 testes)
npx playwright test

# Apenas marketplace
npx playwright test --project=marketplace

# Apenas painel do fornecedor
npx playwright test --project=supplier

# Com relatório HTML
npx playwright test --reporter=html
```

Os servidores são iniciados automaticamente pelo `playwright.config.ts` via `webServer`. O Chromium é necessário:

```bash
npx playwright install chromium
```

---

## Comandos de Desenvolvimento

```bash
pnpm dev                          # Todos os serviços em paralelo
pnpm build                        # Build completo
pnpm lint                         # Lint em todos os pacotes
pnpm type-check                   # Type check em todos os pacotes

pnpm --filter @obraja/api dev     # Apenas a API
pnpm --filter @obraja/web-marketplace dev   # Apenas o marketplace
pnpm --filter @obraja/web-supplier dev      # Apenas o painel do fornecedor
pnpm --filter @obraja/web-admin dev         # Apenas o admin
```

---

## Design System

| Token | Valor |
|-------|-------|
| Primary Orange | `#F05A28` |
| Deep Orange | `#CC4010` |
| Black | `#1A1A1A` |
| Yellow Accent | `#FFB800` |
| Font web | Inter |
| Font mobile | Manrope |

---

## Roadmap

- [x] Auth JWT + refresh token + RBAC
- [x] Cadastro e aprovação de fornecedores
- [x] Catálogo de produtos + busca + filtros
- [x] Carrinho unificado multi-fornecedor
- [x] Checkout com ViaCEP
- [x] Split de pedidos por fornecedor (SubOrders)
- [x] B2B: enforcement de b2bPrice e MOQ
- [x] Cadastro de entregadores com upload de documentos
- [x] Upload de documentos (pendente: migrar para R2)
- [x] Painel do fornecedor com proteção de rotas
- [x] Painel admin (aprovações, fornecedores, usuários)
- [x] Testes E2E com Playwright (44 testes)
- [ ] Integração Asaas (PIX + cartão + split)
- [ ] BullMQ: filas para email, NF-e, push
- [ ] Socket.io: notificações em tempo real
- [ ] Row-Level Security (RLS) no PostgreSQL
- [ ] Focus NFe: emissão automática
- [ ] Apps mobile (React Native + Expo)

---

## Licença

Proprietário — todos os direitos reservados.
