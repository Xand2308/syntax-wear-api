import type { FastifyRequest, FastifyReply } from "fastify";
import {
  createStripeCheckoutService,
  syncOrderFromStripeSession,
} from "../services/stripe.service";
import { createOrderSchema } from "../utils/validators";
import { createOrder } from "../services/orders.service";

export class StripeController {
  async createCheckoutSession(request: FastifyRequest, reply: FastifyReply) {
    const { items, shippingAddress, paymentMethod, userId, shippingCost } =
      createOrderSchema.parse(request.body);

    const order = await createOrder({
      items,
      shippingAddress,
      paymentMethod,
      userId,
      shippingCost,
    });

    const products = order.items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      unitPrice: Number(item.price),
      quantity: item.quantity,
    }));

    const { sessionId } = await createStripeCheckoutService({
      products,
      orderId: order.id,
    });

    return reply.status(200).send({
      sessionId,
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

    return reply.redirect(
      `${frontendUrl}/success?orderId=${result.orderId}&status=${result.orderStatus}`,
    );
  }

  async syncCheckout(
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply,
  ) {
    const result = await syncOrderFromStripeSession(request.params.sessionId);
    return reply.status(200).send(result);
  }
}
