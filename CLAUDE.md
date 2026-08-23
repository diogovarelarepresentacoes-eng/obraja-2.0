# ObraJá 2.0 — Guia do Projeto

## Visão Geral

ObraJá 2.0 é um marketplace híbrido **B2B/B2C multi-vendedor** para materiais de construção civil, inspirado no iFood. Conecta fábricas, lojas de materiais, construtoras e consumidores finais em um ecossistema unificado com logística própria e de terceiros.

**Modelo de negócio:** fornecedores pagam comissão por venda; plataforma gerencia catálogo, pagamentos, NF-e e logística.

---

## Design System

| Token | Valor |
|-------|-------|
| Primary Orange | `#F05A28` |
| Deep Orange | `#CC4010` |
| Black | `#1A1A1A` |
| Yellow Accent | `#FFB800` |
| White | `#FFFFFF` |
| Font | Inter (web) / Manrope (mobile) |

---

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|--------------|
| Monorepo | Turborepo + pnpm workspaces | Compartilhamento de types e UI |
| Web (marketplace) | Next.js 15 App Router + TailwindCSS | SSR/SSG para SEO de produtos |
| Web (admin) | Next.js 15 App Router + TailwindCSS | SPA-like com React Server Components |
| Web (supplier) | Next.js 15 App Router + TailwindCSS | Painel do fornecedor |
| Mobile (comprador) | React Native + Expo SDK 52 | iOS + Android unificado |
| Mobile (entregador) | React Native + Expo SDK 52 | GPS tracking nativo |
| Backend API | NestJS + TypeScript strict | Módulos, guards, interceptors |
| ORM | Prisma | Migrations, type-safety, performance |
| Banco de dados | PostgreSQL (autogerenciado — sem Supabase) | RLS multi-tenant, confiabilidade |
| Cache / Filas | Redis + BullMQ | Emails, NF-e, push, processamento |
| Auth | JWT + Refresh Token (HttpOnly cookie) | Segurança contra XSS |
| Storage | Cloudflare R2 (compatível S3) | Documentos, imagens de produtos |
| Pagamentos | Asaas | PIX, boleto, cartão de crédito |
| NF-e | Focus NFe | Emissão automática NF-e/NFS-e |
| Email | Nodemailer + SMTP | Transacional: aprovações, pedidos |
| Push | Firebase FCM | Notificações mobile |
| WebSocket | Socket.io | Status pedido em tempo real |

---

## Estrutura do Monorepo

```
obraja-2.0/
├── apps/
│   ├── web-marketplace/     # Next.js — vitrine + carrinho + checkout
│   ├── web-admin/           # Next.js — painel administrativo
│   ├── web-supplier/        # Next.js — painel do fornecedor
│   ├── mobile-buyer/        # Expo — app comprador (iOS/Android)
│   └── mobile-delivery/     # Expo — app entregador
├── packages/
│   ├── api/                 # NestJS — API principal
│   ├── database/            # Prisma schema + seed + migrations
│   ├── ui/                  # Componentes compartilhados (Button, Card, etc.)
│   ├── types/               # Tipos TypeScript compartilhados
│   └── config/              # ESLint, Prettier, TSConfig base
├── docs/
│   ├── business-context.md  # Diagrama contexto de negócio (este arquivo)
│   └── er-diagram.md        # Diagrama ER detalhado
├── CLAUDE.md                # Este arquivo
└── skills.md                # Tecnologias e habilidades
```

---

## Roles & RBAC

| Role | Token | Acesso |
|------|-------|--------|
| Administrador | `ADMIN` | Tudo — aprovações, usuários, configurações, relatórios |
| Fornecedor Loja | `SUPPLIER_STORE` | Painel próprio — produtos, estoque, pedidos, frete |
| Fornecedor Fábrica | `SUPPLIER_FACTORY` | Painel próprio — produtos, MOQ, tabelas de preço B2B |
| Construtora | `CONTRACTOR` | Marketplace B2B — preços atacado, prazo, NF-e, crédito |
| Comprador Final | `BUYER` | Marketplace B2C — catálogo, carrinho, pedidos |
| Entregador | `DRIVER` | App entregador — aceitar, rastrear, concluir entregas |

Cada fornecedor vê **apenas seus próprios dados**. Cada cliente vê **apenas seus pedidos**. Implementar com Row-Level Security (RLS) no PostgreSQL.

---

## Fluxos Principais

### 1. Onboarding de Fornecedor (Loja / Fábrica)
```
Fornecedor preenche cadastro
  → Upload: contrato social + CNPJ + IE (obrigatórios)
  → Status: PENDING_REVIEW
  → Admin revisa no painel de aprovações
  → [APROVADO] → e-mail boas-vindas + acesso ao painel
  → [REJEITADO] → e-mail com motivo + possibilidade de recurso
```

### 2. Cadastro de Construtora (B2B)
```
Construtora preenche formulário com CNPJ
  → Validação automática via API Receita Federal
  → Upload: contrato social + IE + comprovante de atividade
  → Admin valida documentos + define limite de crédito
  → Aprovação libera: preços atacado, prazos, emissão NF-e
```

### 3. Fluxo de Compra B2C
```
Cliente navega catálogo unificado (busca / categoria / localização)
  → Adiciona produtos de múltiplos fornecedores → carrinho único
  → Calcula frete por fornecedor × CEP destino
  → Checkout único: PIX / cartão / boleto via Asaas
  → Sistema divide internamente em sub-pedidos por fornecedor
  → Notificação fornecedor + cliente
  → Entregador aceita → rastreamento GPS em tempo real
  → Entrega confirmada → rating + NF-e gerada automaticamente
```

### 4. Fluxo de Compra B2B (Construtora)
```
Construtora acessa catálogo com preços de atacado (só visível pós-aprovação)
  → Verifica MOQ mínimo por produto
  → Define quantidade + seleciona prazo de pagamento aprovado
  → Checkout: boleto bancário com prazo / PIX / cartão corporativo
  → Sistema emite NF-e contra CNPJ da construtora automaticamente
  → Pedido vai para separação no fornecedor
```

---

## Regras de Negócio Críticas

- Nenhum fornecedor acessa o painel antes de aprovação do admin
- Preços B2B (atacado) visíveis **apenas** para `CONTRACTOR` aprovados
- Carrinho unificado: internamente dividido por `supplierId` (sub-pedidos independentes)
- Sub-pedidos têm status, entrega e NF-e separados por fornecedor
- Taxa de comissão (%) configurável por fornecedor pelo admin
- Frete calculado por CEP × fornecedor × peso/dimensão do produto
- CNPJ e CPF validados com checksum + lookup externo antes de aprovação
- Limite de crédito B2B definido pelo admin por construtora

---

## Módulos da API (NestJS)

Base URL: `/api/v1`

| Módulo | Prefixo | Descrição |
|--------|---------|-----------|
| Auth | `/auth` | Login, registro, refresh, logout, forgot-password |
| Users | `/users` | CRUD usuários, roles, perfil |
| Approvals | `/approvals` | Admin: listar, aprovar, rejeitar cadastros |
| Suppliers | `/suppliers` | Painel do fornecedor: dados, configurações |
| Products | `/products` | Catálogo, estoque, variações, importação CSV |
| Categories | `/categories` | Hierarquia de categorias |
| Pricing | `/pricing` | Tabelas de preço B2B, MOQ, volume |
| Cart | `/cart` | Carrinho unificado por sessão/usuário |
| Orders | `/orders` | Pedidos (split automático), histórico, status |
| Payments | `/payments` | Asaas — PIX, boleto, cartão, webhook |
| Delivery | `/delivery` | Drivers, aceitar entrega, tracking GPS |
| Invoices | `/invoices` | Focus NFe — emitir, consultar, cancelar NF-e |
| Notifications | `/notifications` | WebSocket em tempo real + push FCM |
| Reports | `/reports` | Admin: vendas, comissões, fornecedores |

---

## Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/obraja2

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Pagamentos
ASAAS_API_KEY=
ASAAS_ENVIRONMENT=sandbox   # sandbox | production

# Nota Fiscal Eletrônica
FOCUS_NFE_TOKEN=
FOCUS_NFE_ENVIRONMENT=homologacao   # homologacao | producao

# Storage (S3/R2)
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

# Lookup
RECEITA_FEDERAL_API_KEY=   # para validação CNPJ
```

---

## Padrões de Desenvolvimento

### Código
- TypeScript strict em toda a stack
- `class-validator` em todos os DTOs (nunca aceitar raw request body)
- Respostas envelopadas: `{ success: boolean, data: T, timestamp: string }`
- Erros padronizados com código HTTP correto e mensagem descritiva
- Logs estruturados (sem PII — mascarar CPF/CNPJ/email nos logs)
- Arquivos < 500 linhas — dividir em módulos menores

### Segurança
- Nunca commitar `.env` ou secrets
- CORS permitir apenas domínios autorizados (configurável por ambiente)
- Rate limiting: auth 10 req/min, API geral 100 req/min
- Helmet.js para headers HTTP
- Upload de arquivos: validar MIME type real (não só extensão), max 10 MB
- Validar CNPJ e CPF com dígito verificador no backend

### Banco de Dados
- Row-Level Security (RLS) para isolamento entre fornecedores
- Indexes obrigatórios em: userId, supplierId, orderId, createdAt
- Transações Prisma para operações multi-tabela (split de pedido)
- Nunca deletar registros de pedido — usar soft delete (deletedAt)

### Testes
- Jest: unitários para services NestJS
- Supertest: integração para endpoints HTTP
- Postman/Newman: integrado no CI/CD
- k6: testes de carga antes de cada release

---

## Comandos de Desenvolvimento

```bash
# Setup inicial
pnpm install
cp packages/api/.env.example packages/api/.env

# Desenvolvimento (todos os serviços)
pnpm dev

# Apenas API NestJS
pnpm --filter @obraja/api dev

# Apenas marketplace web
pnpm --filter @obraja/web-marketplace dev

# Prisma migrations
pnpm --filter @obraja/database migrate:dev --name nome_migration

# Gerar tipos Prisma
pnpm --filter @obraja/database generate

# Testes
pnpm test
pnpm test:e2e

# Build completo
pnpm build

# Docker local
docker compose up -d
```
