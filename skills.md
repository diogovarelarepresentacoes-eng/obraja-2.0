# ObraJá 2.0 — Skills & Tecnologias

> Mapa de habilidades e tecnologias necessárias para o desenvolvimento da plataforma.
> Organizado por camada, com nível de domínio necessário e contexto de uso.

---

## Frontend Web (Next.js 15)

| Skill | Nível | Uso no Projeto |
|-------|-------|---------------|
| Next.js 15 App Router | Avançado | 3 apps: marketplace (SSR/SSG para SEO), admin, supplier |
| React 19 (Server + Client Components) | Avançado | Separação clara server/client para performance |
| TypeScript strict | Avançado | Strict mode em toda a stack, sem `any` |
| TailwindCSS | Intermediário | Design system ObraJá com CSS variables e tokens |
| React Hook Form + Zod | Intermediário | Formulários multi-etapa com validação client-side |
| TanStack Query v5 | Intermediário | Data fetching, cache, prefetch, infinite scroll |
| Zustand | Básico | Estado global: carrinho, autenticação, UI |
| Socket.io Client | Básico | Notificações e status de pedido em tempo real |
| Next.js Image | Básico | Otimização automática de imagens do catálogo |
| next-intl (i18n) | Básico | Internacionalização — pt-BR prioritário |

---

## Mobile (React Native / Expo)

| Skill | Nível | Uso no Projeto |
|-------|-------|---------------|
| React Native | Avançado | Apps: mobile-buyer e mobile-delivery |
| Expo SDK 52+ | Avançado | Câmera (docs), GPS, push, câmera de produto |
| Expo Router (file-based) | Intermediário | Navegação declarativa com deep links |
| expo-secure-store | Básico | Armazenar tokens JWT com segurança |
| expo-location + watchPositionAsync | Intermediário | Rastreamento GPS do entregador em tempo real |
| react-native-maps | Intermediário | Mapa de rastreamento (comprador e entregador) |
| expo-camera | Básico | Upload de documentos por foto (cadastro) |
| Zustand + MMKV | Básico | Estado global com persistência rápida |
| Firebase Cloud Messaging | Básico | Push notifications Android e iOS |

---

## Backend (NestJS)

| Skill | Nível | Uso no Projeto |
|-------|-------|---------------|
| NestJS (módulos, guards, interceptors) | Avançado | API principal com RBAC, throttling, transform |
| TypeScript strict + decorators | Avançado | Toda a camada de negócio |
| Prisma ORM | Avançado | Schema, migrations, transactions, relations |
| JWT + HttpOnly Cookies | Intermediário | Access token 15min + refresh token 7d |
| BullMQ + Redis | Intermediário | Filas: emails, NF-e, notificações push |
| Socket.io (Server) | Intermediário | Gateway WebSocket para status de pedidos |
| class-validator + class-transformer | Básico | Validação e serialização de DTOs |
| @nestjs/swagger | Básico | Documentação OpenAPI automática |
| Multipart/FormData (Multer) | Básico | Upload de documentos (cadastro) e imagens |
| NestJS Throttler | Básico | Rate limiting por rota e por usuário |
| @nestjs/schedule | Básico | Crons: limpeza de carrinho, NF-e pendentes |

---

## Banco de Dados

| Skill | Nível | Uso no Projeto |
|-------|-------|---------------|
| PostgreSQL | Avançado | Schema relacional central, transações ACID |
| Row-Level Security (RLS) | Intermediário | Isolamento de dados por fornecedor/cliente |
| Indexes & EXPLAIN ANALYZE | Intermediário | Performance em catálogo (milhares de produtos) |
| Prisma Migrations | Intermediário | Versionamento de schema com rollback |
| Prisma Transactions | Básico | Split de pedido em múltiplos sub-pedidos |
| Redis | Básico | Cache de catálogo, sessões de carrinho anônimo, BullMQ |

### Entidades Principais

```
users → supplier_profiles / contractor_profiles / driver_profiles
suppliers → products → product_variants → product_images
products → categories (hierárquica)
carts → cart_items (por sessão ou userId)
orders → order_items + sub_orders (por supplierId)
sub_orders → deliveries → delivery_tracking
payments → payment_events (webhook Asaas)
invoices → nfe_events (Focus NFe)
documents (upload cadastro) → approvals
notifications
```

---

## Integrações Externas

| Integração | Provider | Uso |
|------------|----------|-----|
| Pagamentos | Asaas | PIX, boleto, cartão — checkout + webhooks |
| NF-e / NFS-e | Focus NFe | Emissão automática pós-pagamento confirmado |
| Push Notifications | Firebase FCM | Mobile iOS + Android |
| Storage de arquivos | Cloudflare R2 (S3-compat) | Documentos, fotos de produtos |
| CEP / Endereço | ViaCEP (gratuito) | Autocomplete de CEP no cadastro |
| Validação CNPJ | ReceitaWS ou BrasilAPI | Lookup cadastral (gratuito) |
| Email transacional | SMTP próprio ou Resend | Aprovação, pedido, entrega |
| Mapas | Google Maps ou Mapbox | Rastreamento entregador |

---

## DevOps & Infraestrutura

| Skill | Nível | Uso |
|-------|-------|-----|
| Docker + Docker Compose | Intermediário | Containers locais e produção |
| GitHub Actions | Intermediário | CI: lint, test, build; CD: deploy automático |
| Terraform | Básico | Infra como código (AWS EC2 ou VPS Hostinger) |
| Nginx ou Traefik | Básico | Reverse proxy + SSL automático Let's Encrypt |
| PostgreSQL self-managed | Intermediário | VPS dedicado, backups automáticos (pg_dump) |
| Redis self-managed | Básico | Mesmo VPS ou Redis Cloud Free Tier |
| Turborepo | Básico | Build cache, pipeline de tasks, remote cache |

---

## Testes

| Ferramenta | Tipo | Uso |
|------------|------|-----|
| Jest | Unitário | NestJS services, validators, utils |
| Supertest | Integração | Endpoints HTTP com banco real |
| Postman / Newman | API | Coleções por módulo, CI integration |
| k6 | Carga | Simular picos — checkout, catálogo (Black Friday) |
| React Testing Library | Componente | Formulários de cadastro, carrinho |

---

## Segurança

| Skill | Contexto |
|-------|---------|
| OWASP Top 10 | Validar todo input, prevenir SQL injection (Prisma protege), XSS (React escapa) |
| Rate Limiting | `@nestjs/throttler` — auth 10/min, API 100/min |
| CORS restrito | Apenas domínios autorizados por ambiente |
| Helmet.js | HTTP security headers (X-Frame-Options, CSP, etc.) |
| Argon2 | Hash de senhas (substitui bcrypt) |
| Validação CNPJ/CPF | Dígito verificador no backend (nunca confiar no frontend) |
| Anti-fraude documentos | MIME type real (não extensão), max 10 MB, selfie com documento |
| HttpOnly cookies | Refresh token nunca exposto ao JavaScript |
| PII nos logs | Mascarar CPF, CNPJ, email, telefone nos logs estruturados |

---

## Design / UX

| Skill | Contexto |
|-------|---------|
| Mobile-first | 62%+ do tráfego mobile — começar pelo mobile, escalar para desktop |
| Design tokens | Cores e tipografia do ObraJá aplicadas via CSS variables e Tailwind config |
| Figma | Protótipos antes de codar — especialmente cadastro multi-etapa e checkout |
| Skeleton loading | UX durante carregamento do catálogo (evitar layout shift) |
| Infinite scroll / Virtual list | Catálogo com milhares de produtos sem travar |
| Acessibilidade WCAG 2.1 AA | Contraste mínimo 4.5:1, navegação por teclado, ARIA labels |
| Micro-animações | Feedback visual no carrinho, confirmação de pedido (Framer Motion) |

---

## Prioridade de Aprendizado

> Para quem está começando no projeto, esta é a ordem recomendada:

1. **TypeScript** — fundação de toda a stack
2. **NestJS** — backend, a camada mais complexa
3. **Prisma** — schema do banco, ponto crítico do sistema
4. **Next.js 15 App Router** — marketplace e admin
5. **React Native + Expo** — apps mobile
6. **Asaas + Focus NFe** — integrações de negócio críticas
7. **Docker + GitHub Actions** — DevOps para deploy
