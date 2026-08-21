# Copilot Instructions - Syntax Wear API

## Visão Geral do Projeto
API REST em Node.js + Fastify + TypeScript para o e-commerce **Syntax Wear**.
- **Stack**: Fastify (v5), Prisma ORM (v7), PostgreSQL (Supabase / local), JWT (`@fastify/jwt`), Zod, Scalar API Reference / OpenAPI Swagger, Bcrypt, Slugify.
- **Arquitetura em camadas**: `routes` → `controllers` → `services` → `Prisma ORM`.

---

## Estrutura de Camadas e Responsabilidades

```
src/
├── app.ts                  → Setup do Fastify, plugins (CORS, Helmet, JWT, Swagger, Scalar), rotas e errorHandler global
├── routes/                 → Definição de rotas HTTP + schemas OpenAPI (tags, description, body, params, querystring, response, security)
├── controllers/            → Extração de dados da requisição, validação com Zod (.parse), orquestração de serviços e respostas HTTP
├── services/               → Lógica de negócio, regras de domínio, transações (prisma.$transaction) e queries Prisma
├── middlewares/            → Middlewares (auth.middlewares.ts para JWT, error.middleware.ts para tratamento global de erros)
├── utils/                  → prisma.ts (cliente Prisma), validators.ts (schemas Zod centralizados)
└── types/                  → Interfaces e types TypeScript do domínio (index.ts)
```

### Exemplo de Fluxo Completo:
1. `routes/orders.routes.ts`: Registra `POST /orders` com schema OpenAPI para documentação Scalar.
2. `controllers/orders.controller.ts`: Valida `request.body` com `createOrderSchema.parse()`, chama `createOrder(data)` e responde com HTTP 201.
3. `services/orders.service.ts`: Executa transação no Prisma (`prisma.$transaction`), valida existência, status ativo e estoque dos produtos, calcula total com snapshot de preços, cria `Order`, cria `OrderItem`s e decrementa estoque.

---

## Modelos Prisma (Banco de Dados)

- **User**: `id`, `firstName`, `lastName`, `email` (@unique), `password` (bcrypt hash), `cpf` (@unique?), `phone?`, `birthDate?`, `role` (`Role` enum: `USER`, `ADMIN`), `orders Order[]`.
- **Category**: `id`, `name`, `slug` (@unique), `description?`, `active` (boolean, default `true`), `products Product[]`.
- **Product**: `id`, `name`, `slug` (@unique), `description?`, `price` (Decimal), `colors` (Json?), `images` (Json?), `sizes` (Json?), `stock` (Int, default `0`), `active` (boolean, default `true`), `categoryId` (Int), `category Category`, `orderItems OrderItem[]`.
- **Order**: `id`, `userId` (Int?, opcional para guest checkout), `user User?`, `total` (Decimal), `status` (`OrderStatus` enum: `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`), `shippingAddress` (Json), `paymentMethod` (String), `items OrderItem[]`.
- **OrderItem**: `id`, `orderId`, `order Order`, `productId`, `product Product`, `price` (Decimal snapshot), `quantity` (Int), `size` (String?).

---

## Módulos Implementados

### 1. Autenticação (`/auth`)
- `POST /auth/register`: Cadastro de usuário com senha criptografada via `bcrypt` (salt 10), role `USER`, retorna dados do usuário e token JWT.
- `POST /auth/login`: Autenticação por email e senha via `bcrypt.compare`, retorna dados do usuário e token JWT.

### 2. Produtos (`/products`)
- `GET /products`: Listagem paginada (`page`, `limit`), filtros por `minPrice`, `maxPrice`, `search` (busca insensível em `name` e `description` via `where.OR`), `categoryId`, ordenação (`sortBy`: `price` | `name` | `createdAt`, `sortOrder`: `asc` | `desc`).
- `GET /products/:id`: Detalhes do produto por ID com categoria inclusa.
- `POST /products`: Criação com geração automática de `slug` via `slugify`, validação de `categoryId` e campos obrigatórios.
- `PUT /products/:id`: Atualização parcial de dados (recalcula `slug` se `name` for alterado, valida unicidade).
- `DELETE /products/:id`: Soft delete (`active: false`).

### 3. Categorias (`/categories`)
- `GET /categories`: Listagem de categorias ativas (`active: true`), com suporte a paginação e filtro `search` por nome.
- `GET /categories/:id`: Busca categoria por ID.
- `POST /categories`: Criação com `slug` gerado automaticamente a partir do nome, validação de unicidade de `slug`.
- `PUT /categories/:id`: Atualização de dados da categoria (com recalculo de `slug` se nome mudar).
- `DELETE /categories/:id`: Soft delete em cascata — desativa a categoria (`active: false`) e desativa automaticamente todos os produtos vinculados a ela (`Product.active: false`).

### 4. Pedidos (`/orders`)
- `GET /orders`: Listagem com filtros por `status`, `userId`, intervalo de datas (`startDate`, `endDate`) e paginação (`page`, `limit`). Inclui relacionamento com `user` e `items` (com `product` e `category`).
- `GET /orders/:id`: Detalhes completos do pedido por ID.
- `POST /orders`: Criação atômica via `prisma.$transaction`:
  - Valida se todos os produtos solicitados existem no banco.
  - Valida se os produtos estão ativos (`active: true`).
  - Valida se há estoque suficiente (`product.stock >= item.quantity`).
  - Valida disponibilidade do tamanho selecionado se o produto possuir `sizes`.
  - Calcula o total com base no snapshot do preço atual de cada produto.
  - Cria o registro `Order`, insere os `OrderItem`s com o snapshot de preço e decrementa o estoque atômico de cada produto (`stock: { decrement: quantity }`).
- `PUT /orders/:id`: Atualização de `status` do pedido e/ou `shippingAddress`.
- `DELETE /orders/:id`: Cancelamento de pedido (altera status para `CANCELLED`, validando que pedidos já cancelados ou entregues não podem ser cancelados).

---

## Convenções e Padrões de Código

### Validação com Zod
- **SEMPRE** defina schemas em `src/utils/validators.ts`.
- **SEMPRE** faça a validação no controller usando `.parse()`.
- O middleware `errorHandler` captura `ZodError` automaticamente e retorna formato amigável com `z.treeifyError(error)`.

### Geração de Slugs
- Utilize a biblioteca `slugify` em português:
  ```typescript
  body.slug = slugify(body.name, { lower: true, strict: true, locale: "pt" });
  ```

### Soft Deletes
- Para deleção lógica, atualize `active: false`.
- Ao desativar categorias, lembre-se de aplicar a desativação em cascata para os produtos correspondentes.

### Tratamento de Erros
- Nos services, lance erros descritivos em português:
  ```typescript
  throw new Error("Produto não encontrado");
  ```
- O `errorHandler` global em `src/middlewares/error.middleware.ts` captura erros do Fastify, Zod e exceções gerais.

### Valores Monetários e Decimais
- O Prisma retorna `Decimal` para campos `price` e `total`.
- Para cálculos aritméticos, converta com `Number(product.price)` ou use utilitários do `decimal.js`.

### OpenAPI & Documentação
- Documentação interativa disponível em `http://localhost:3000/api-docs` (Scalar UI).
- Todas as rotas em `src/routes/*.routes.ts` devem conter o schema OpenAPI (`tags`, `description`, `params`, `querystring`, `body`, `response`, `security`).

---

## Comandos Essenciais

```bash
npm run dev              # Iniciar servidor em modo dev com tsx watch
npm run prisma:generate  # Gerar cliente do Prisma
npm run prisma:migrate   # Aplicar migrations (prisma migrate dev)
npm run prisma:studio    # Abrir interface visual do banco (Prisma Studio)
npm run prisma:seed      # Executar seed do banco de dados (tsx prisma/seed.ts)
npm run build            # Compilar TypeScript para dist
npm start                # Executar build de produção
```

---

## Próximos Passos (Roadmap)

1. **Autenticação & Autorização (RBAC)**:
   - Ativar hook `fastify.addHook("onRequest", authenticate)` nas rotas que exigem proteção.
   - Criar middleware de autorização por papel (`Role: ADMIN` vs `USER`) para operações de CRUD restritas.
2. **Upload de Imagens**:
   - Integração com Supabase Storage para upload de imagens de produtos e salvamento de URLs no campo `Product.images`.
3. **Cálculo de Frete (ViaCEP)**:
   - Endpoint `POST /shipping/calc` integrado à API do ViaCEP para cálculo de prazo e valor de frete.
4. **Integração de Pagamentos**:
   - Integração com gateway de pagamentos (Stripe / Pagar.me) e webhook para transição de status do pedido para `PAID`.
5. **Newsletter / Subscriptions**:
   - Criação do model `Subscription` e endpoints para inscrição de newsletter.
6. **Testes Automatizados**:
   - Configuração do Vitest para testes unitários (validações, cálculos, regras de negócio) e testes de integração de rotas (Supertest / Fastify inject).