# Resumo do Checkout Stripe

## Fluxo implementado

1. O frontend envia itens, endereço, forma de pagamento e frete para `POST /stripe/checkout`.
2. A API cria um único pedido com status `PENDING`.
3. A API cria uma sessão hospedada da Stripe e retorna `sessionId` e `checkoutUrl`.
4. O frontend redireciona o navegador para `checkoutUrl`.
5. Após o pagamento, o webhook ou o retorno `/stripe/success` atualiza o pedido para `PAID`.
6. A API redireciona para a home do frontend com `orderId` e `status` na query string.

## Correções realizadas

- Checkout guest e checkout autenticado com Bearer token ou cookie JWT.
- Usuário autenticado associado automaticamente ao pedido, sem aceitar `userId` manual.
- Campos de formulário aceitos como texto ou número: `productId`, `quantity`, `number` e `shippingCost`.
- CEP aceito com ou sem hífen.
- Produtos repetidos no carrinho validados corretamente.
- Produto inexistente retorna `404`.
- Estoque insuficiente retorna `409`, em vez de `500`.
- URL de pagamento Stripe validada antes da resposta.
- Frete incluído no valor da sessão Stripe.
- Retorno pós-pagamento direcionado para a home existente do frontend.
- Administradores podem listar todos os pedidos.

## Testes realizados

- `npm run build`: aprovado.
- Inicialização do Fastify: aprovada.
- Chave Stripe de teste: válida.
- Criação real de checkout: aprovada com resposta `200`.
- Pagamento de teste: pedido atualizado de `PENDING` para `PAID`.
- Produto sem estoque: erro identificado e convertido para `409`.

## Atenção

- Não executar `seed-antigo.ts`; ele é um arquivo antigo, possui import incorreto e pode apagar dados.
- Para testar, usar um produto com estoque maior que zero.
- O frontend deve executar `window.location.assign(data.checkoutUrl)` após o `POST /stripe/checkout`.
- O aviso do React sobre `src=""` é separado do checkout e deve ser corrigido no frontend renderizando a imagem apenas quando houver URL.
