# Fluxo de pagamento Stripe

## O que foi implementado

- A criação do Checkout grava o `orderId` como texto na metadata da Checkout Session.
- O mesmo `orderId` também é enviado na metadata do PaymentIntent.
- O pedido é criado inicialmente como `PENDING`.
- O webhook `/stripe/webhook` valida a assinatura do Stripe usando o corpo bruto da requisição.
- O webhook atualiza o pedido para `PAID` nos eventos:
  - `checkout.session.completed`, quando `payment_status` é `paid`;
  - `checkout.session.async_payment_succeeded`;
  - `payment_intent.succeeded`.
- Falhas de cobrança (`charge.failed`) alteram o pedido para `CANCELLED`.
- O retorno de sucesso do Checkout passa por `/stripe/success?session_id=...`.
- Nesse retorno, a API consulta diretamente a sessão no Stripe e atualiza o pedido para `PAID` quando o pagamento está confirmado.
- Também foi disponibilizado `GET /stripe/status/:sessionId` para sincronizar uma sessão manualmente ou por uma tela de confirmação.

## Por que existem duas formas de atualização

O webhook é a forma principal e confiável de receber eventos assíncronos do Stripe. A sincronização pelo retorno do Checkout funciona como uma segunda camada para o ambiente local, onde o webhook pode não alcançar `localhost` ou pode estar usando um segredo diferente.

As duas formas gravam o status pelo Prisma Client na mesma base PostgreSQL configurada em `DATABASE_URL`. Por isso, a alteração fica disponível tanto no Prisma Studio quanto no Supabase quando ambos usam a mesma conexão.

## Configuração necessária

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET_KEY=whsec_...
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

Para desenvolvimento local, o Stripe CLI pode encaminhar eventos para:

```bash
stripe listen --forward-to localhost:3000/stripe/webhook
```

O Checkout deve ser criado novamente depois de alterar `API_URL`, porque sessões antigas mantêm o `success_url` usado na criação.

## Fluxo esperado

1. `POST /stripe/checkout` recebe itens, endereço e método de pagamento com o token do usuário.
2. A API cria um único pedido como `PENDING` e retorna `sessionId` e `checkoutUrl`.
3. O cliente redireciona para `checkoutUrl` e finaliza o pagamento no Stripe.
4. O webhook ou o retorno `/stripe/success` atualiza o pedido para `PAID`.
5. Como alternativa, um pedido já criado pode ser pago enviando `{ "orderId": 123 }`.
