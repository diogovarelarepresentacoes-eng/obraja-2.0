# ObraJá 2.0 — Contexto de Negócio

> Diagrama de memória da lógica de negócio. Use como referência para entender atores, fluxos e regras antes de iniciar qualquer módulo.

---

## 1. Atores do Sistema

```mermaid
graph TD
    ADMIN["👑 Administrador\n(backoffice)"]
    FACTORY["🏭 Fábrica\n(fornecedor atacado)"]
    STORE["🏪 Loja de Materiais\n(fornecedor varejo)"]
    CONTRACTOR["🏗️ Construtora\n(comprador CNPJ/B2B)"]
    BUYER["🧑 Consumidor Final\n(comprador CPF/B2C)"]
    DRIVER_OWN["🚛 Entregador Próprio\n(frota ObraJá)"]
    DRIVER_3P["🚐 Entregador Terceiro\n(transportadora)"]

    ADMIN -->|aprova / rejeita| FACTORY
    ADMIN -->|aprova / rejeita| STORE
    ADMIN -->|valida crédito B2B| CONTRACTOR
    ADMIN -->|configura comissão| FACTORY
    ADMIN -->|configura comissão| STORE

    FACTORY -->|cadastra produtos com MOQ| CATALOG["📦 Catálogo Unificado"]
    STORE -->|cadastra produtos varejo| CATALOG

    CONTRACTOR -->|compra em atacado| CATALOG
    BUYER -->|compra em varejo| CATALOG

    CATALOG --> CART["🛒 Carrinho Único"]
    CART --> CHECKOUT["💳 Checkout"]
    CHECKOUT --> PAYMENT["💰 Pagamento\n(Asaas)"]
    PAYMENT -->|confirmado| SUBORDER["📋 Sub-Pedidos\npor Fornecedor"]
    SUBORDER --> NFE["🧾 NF-e automática\n(Focus NFe)"]
    SUBORDER --> DELIVERY["📦 Entrega"]
    DELIVERY --> DRIVER_OWN
    DELIVERY --> DRIVER_3P
```

---

## 2. Mapa de Roles e Permissões

```mermaid
graph LR
    subgraph Roles["Roles do Sistema (RBAC)"]
        ADMIN_R["ADMIN"]
        SUPPLIER_S["SUPPLIER_STORE"]
        SUPPLIER_F["SUPPLIER_FACTORY"]
        CONTRACTOR_R["CONTRACTOR"]
        BUYER_R["BUYER"]
        DRIVER_R["DRIVER"]
    end

    subgraph Areas["Áreas de Acesso"]
        BACKOFFICE["Backoffice Admin\n/admin/*"]
        SUPPLIER_PANEL["Painel Fornecedor\n/supplier/*"]
        MARKETPLACE["Marketplace\n/shop/*"]
        DRIVER_APP["App Entregador\n/driver/*"]
    end

    ADMIN_R -->|acesso total| BACKOFFICE
    ADMIN_R -->|pode visualizar| SUPPLIER_PANEL
    ADMIN_R -->|pode visualizar| MARKETPLACE

    SUPPLIER_S -->|apenas seus dados| SUPPLIER_PANEL
    SUPPLIER_F -->|apenas seus dados| SUPPLIER_PANEL

    CONTRACTOR_R -->|preços atacado + NF-e| MARKETPLACE
    BUYER_R -->|preços varejo| MARKETPLACE

    DRIVER_R -->|entregas disponíveis| DRIVER_APP
```

---

## 3. Fluxo de Aprovação de Cadastro

```mermaid
sequenceDiagram
    participant FRN as Fornecedor / Construtora
    participant SYS as Sistema ObraJá
    participant ADM as Administrador
    participant EMAIL as E-mail

    FRN->>SYS: Preenche formulário + upload de documentos
    SYS->>SYS: Valida CNPJ (checksum + Receita Federal)
    SYS->>SYS: Valida CPF (checksum) se pessoa física
    SYS->>SYS: Cria registro com status PENDING_REVIEW
    SYS->>EMAIL: Notifica admin sobre novo cadastro
    SYS->>FRN: "Aguardando análise — você receberá e-mail em até 48h"

    ADM->>SYS: Acessa painel de aprovações
    ADM->>SYS: Analisa documentos submetidos

    alt Aprovado
        ADM->>SYS: Clica "Aprovar" (opcional: define limite de crédito B2B)
        SYS->>SYS: Status → APPROVED, libera acesso ao painel
        SYS->>EMAIL: E-mail de boas-vindas com link de acesso
        EMAIL->>FRN: "Cadastro aprovado! Acesse seu painel."
    else Rejeitado
        ADM->>SYS: Clica "Rejeitar" + informa motivo
        SYS->>SYS: Status → REJECTED
        SYS->>EMAIL: E-mail com motivo da rejeição
        EMAIL->>FRN: "Cadastro não aprovado. Motivo: [...]"
    end
```

---

## 4. Fluxo de Compra (B2C e B2B)

```mermaid
sequenceDiagram
    participant USR as Comprador (B2C ou B2B)
    participant MKT as Marketplace
    participant CART_SVC as CartService
    participant ORDER_SVC as OrderService
    participant PAY as Asaas
    participant SUP1 as Fornecedor A
    participant SUP2 as Fornecedor B
    participant NFE as Focus NFe

    USR->>MKT: Busca produto / navega catálogo
    Note over MKT: B2B: preços atacado (se CONTRACTOR aprovado)
    USR->>CART_SVC: Adiciona produtos (de A e B)
    CART_SVC->>CART_SVC: Calcula frete por CEP × fornecedor
    USR->>ORDER_SVC: Confirma checkout
    ORDER_SVC->>PAY: Cria cobrança (PIX / boleto / cartão)
    PAY-->>ORDER_SVC: Webhook pagamento confirmado
    ORDER_SVC->>ORDER_SVC: Divide em sub-pedidos (por supplierId)
    ORDER_SVC->>SUP1: Notifica sub-pedido A
    ORDER_SVC->>SUP2: Notifica sub-pedido B
    ORDER_SVC->>NFE: Emite NF-e por sub-pedido
    NFE-->>USR: Envia NF-e por e-mail (B2B: contra CNPJ)
    SUP1->>USR: Entrega produto A (rastreamento GPS)
    SUP2->>USR: Entrega produto B (rastreamento GPS)
```

---

## 5. Diagrama de Entidades (ER Simplificado)

```mermaid
erDiagram
    USER {
        uuid id PK
        string email
        string passwordHash
        enum role
        enum status
        timestamp createdAt
    }

    SUPPLIER_PROFILE {
        uuid id PK
        uuid userId FK
        string companyName
        string cnpj
        string tradeName
        float commissionRate
        enum type
    }

    CONTRACTOR_PROFILE {
        uuid id PK
        uuid userId FK
        string companyName
        string cnpj
        float creditLimit
        float usedCredit
    }

    DRIVER_PROFILE {
        uuid id PK
        uuid userId FK
        string cpf
        string vehicleType
        string vehiclePlate
        boolean isOnline
        point currentLocation
    }

    PRODUCT {
        uuid id PK
        uuid supplierId FK
        string name
        string description
        float price
        float b2bPrice
        integer moq
        integer stock
        boolean isActive
    }

    CATEGORY {
        uuid id PK
        uuid parentId FK
        string name
        string slug
    }

    CART {
        uuid id PK
        uuid userId FK
        string sessionId
    }

    CART_ITEM {
        uuid id PK
        uuid cartId FK
        uuid productId FK
        integer quantity
    }

    ORDER {
        uuid id PK
        uuid userId FK
        float totalAmount
        enum paymentMethod
        enum status
        string asaasPaymentId
    }

    SUB_ORDER {
        uuid id PK
        uuid orderId FK
        uuid supplierId FK
        float subtotal
        float freightCost
        enum status
        string nfeKey
    }

    SUB_ORDER_ITEM {
        uuid id PK
        uuid subOrderId FK
        uuid productId FK
        integer quantity
        float unitPrice
    }

    DELIVERY {
        uuid id PK
        uuid subOrderId FK
        uuid driverId FK
        enum status
        string trackingCode
        point currentLocation
        timestamp deliveredAt
    }

    DOCUMENT {
        uuid id PK
        uuid userId FK
        enum type
        string fileUrl
        enum status
    }

    USER ||--o| SUPPLIER_PROFILE : "pode ter"
    USER ||--o| CONTRACTOR_PROFILE : "pode ter"
    USER ||--o| DRIVER_PROFILE : "pode ter"

    SUPPLIER_PROFILE ||--o{ PRODUCT : "cadastra"
    PRODUCT }o--|| CATEGORY : "pertence a"
    PRODUCT }o--|| SUPPLIER_PROFILE : "vendido por"

    USER ||--o| CART : "possui"
    CART ||--o{ CART_ITEM : "contém"
    CART_ITEM }o--|| PRODUCT : "referencia"

    USER ||--o{ ORDER : "realiza"
    ORDER ||--o{ SUB_ORDER : "dividido em"
    SUB_ORDER }o--|| SUPPLIER_PROFILE : "pertence a"
    SUB_ORDER ||--o{ SUB_ORDER_ITEM : "contém"
    SUB_ORDER_ITEM }o--|| PRODUCT : "referencia"
    SUB_ORDER ||--o| DELIVERY : "tem entrega"
    DELIVERY }o--|| DRIVER_PROFILE : "atribuída a"

    USER ||--o{ DOCUMENT : "submete"
```

---

## 6. Mapa de Regras de Negócio

```mermaid
mindmap
  root((ObraJá 2.0\nRegras de Negócio))
    Cadastro
      Fornecedor precisa de aprovação admin
      CNPJ validado na Receita Federal
      CPF validado com dígito verificador
      Upload de documentos obrigatório
      Status PENDING → APPROVED → REJECTED
    Preços
      B2C preço padrão para todos
      B2B preço atacado só para CONTRACTOR aprovado
      MOQ mínimo configurável por produto e fábrica
      Comissão da plataforma configurável por fornecedor
    Carrinho e Pedido
      Carrinho único independente de quantos fornecedores
      Split automático em sub-pedidos por supplierId
      Sub-pedido independente em status e entrega
      Frete calculado por fornecedor × CEP destino
    Pagamento
      PIX  boleto  cartão via Asaas
      B2B pode ter prazo de pagamento pré-aprovado
      NF-e emitida por sub-pedido pós pagamento
      B2B NF-e contra CNPJ da construtora
    Entrega
      Entregador próprio tem prioridade
      Fallback para transportadora terceira
      GPS tracking em tempo real
      Rating pós entrega obrigatório
    Crédito B2B
      Limite de crédito definido pelo admin por construtora
      Sistema bloqueia compra se limite excedido
      Limite liberado após pagamento de faturas em aberto
```

---

## 7. Ciclo de Vida do Pedido

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT : Pedido criado

    PENDING_PAYMENT --> PAYMENT_CONFIRMED : Webhook Asaas OK
    PENDING_PAYMENT --> PAYMENT_FAILED : Webhook Asaas falha / expirou

    PAYMENT_CONFIRMED --> AWAITING_SEPARATION : Sub-pedido gerado por fornecedor
    AWAITING_SEPARATION --> IN_SEPARATION : Fornecedor confirma separação
    IN_SEPARATION --> READY_FOR_PICKUP : Pronto para coleta

    READY_FOR_PICKUP --> IN_TRANSIT : Entregador aceita e coleta
    IN_TRANSIT --> DELIVERED : Entregador confirma entrega
    IN_TRANSIT --> DELIVERY_FAILED : Tentativa falhou (ausência, etc.)

    DELIVERY_FAILED --> IN_TRANSIT : Nova tentativa agendada
    DELIVERY_FAILED --> RETURNED : Devolução ao fornecedor

    DELIVERED --> NFE_ISSUED : Focus NFe emite NF-e
    NFE_ISSUED --> [*]

    PAYMENT_FAILED --> [*]
    RETURNED --> [*]
```

---

## 8. Hierarquia de Categorias (Exemplo)

```
Materiais de Construção
├── Estrutura
│   ├── Cimento e Argamassa
│   ├── Tijolos e Blocos
│   └── Vergalhões e Aço
├── Revestimento
│   ├── Cerâmica e Porcelanato
│   ├── Tinta e Textura
│   └── Pedra e Granito
├── Hidráulica
│   ├── Tubos e Conexões
│   ├── Caixas d'água
│   └── Registros e Válvulas
├── Elétrica
│   ├── Fios e Cabos
│   ├── Quadros Elétricos
│   └── Tomadas e Interruptores
├── Ferramentas
│   ├── Manuais
│   ├── Elétricas
│   └── EPI
└── Acabamento
    ├── Portas e Janelas
    ├── Pisos Externos
    └── Gesso e Drywall
```

---

## 9. Resumo Executivo — Decisões de Arquitetura

| Decisão | Escolha | Por quê |
|---------|---------|---------|
| Banco de dados | PostgreSQL self-managed | Controle total, RLS nativo, sem vendor lock-in |
| ORM | Prisma | Type-safety, migrations, eco NestJS |
| Auth | JWT + HttpOnly cookie | Segurança XSS superior a localStorage |
| Storage | Cloudflare R2 | S3-compatível, barato, CDN global |
| Pagamento | Asaas | Melhor integração PIX/boleto para Brasil |
| NF-e | Focus NFe | API simples, suporta NF-e + NFS-e + CT-e |
| Monorepo | Turborepo | Cache de build, compartilhamento de código |
| Filas | BullMQ + Redis | Processamento assíncrono (NF-e, emails, push) |
| Mobile | React Native + Expo | Reuso de código web (React), ecossistema maduro |
