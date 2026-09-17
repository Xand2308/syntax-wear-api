import type { FastifyRequest, FastifyReply } from "fastify";
import {
  createStripeCheckoutService,
  syncOrderFromStripeSession,
} from "../services/stripe.service";
import { createOrderSchema, stripeCheckoutSchema } from "../utils/validators";
import { createOrder, getOrderById } from "../services/orders.service";

export class StripeController {
  async createCheckoutSession(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: number } | undefined;
    const checkoutData = stripeCheckoutSchema.parse(request.body);
    if ("orderId" in checkoutData && !user) {
      return reply.status(401).send({
        message: "Autenticação necessária para pagar um pedido existente",
      });
    }

    const order = "orderId" in checkoutData
      ? await getOrderById(checkoutData.orderId, user!.id, false)
      : await createOrder({
          ...createOrderSchema.parse(checkoutData),
          userId: user?.id,
        });

    if (order.status !== "PENDING") {
      return reply.status(400).send({
        message: "Somente pedidos pendentes podem iniciar o pagamento",
      });
    }

    const products = order.items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      unitPrice: Number(item.price),
      quantity: item.quantity,
    }));

    const { sessionId, checkoutUrl } = await createStripeCheckoutService({
      products,
      orderId: order.id,
      shippingCost: Number(order.shippingCost),
    });

    return reply.status(200).send({
      sessionId,
      checkoutUrl,
      url: checkoutUrl,
    });
  }

  async completeCheckout(
    request: FastifyRequest<{ Querystring: { session_id?: string } }>,
    reply: FastifyReply,
  ) {
    const sessionId = request.query.session_id;

    if (!sessionId) {
      return reply.status(400).send({ message: "Missing Stripe session_id" });
    }

    const result = await syncOrderFromStripeSession(sessionId);
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const redirectUrl = new URL(frontendUrl);

    redirectUrl.searchParams.set("orderId", String(result.orderId));
    redirectUrl.searchParams.set("status", result.orderStatus);

    return reply.redirect(redirectUrl.toString());
  }

  async syncCheckout(
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply,
  ) {
    const result = await syncOrderFromStripeSession(request.params.sessionId);
    return reply.status(200).send(result);
  }
}
