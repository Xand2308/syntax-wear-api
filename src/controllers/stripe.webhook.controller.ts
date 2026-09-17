import "dotenv/config";
import type { FastifyReply, FastifyRequest } from "fastify";
import Stripe from "stripe";
import { prisma } from "../utils/prisma";

export class StripeWebhookController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing Stripe secret key");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });

    const signature = request.headers["stripe-signature"];

    if (!signature) {
      return reply.status(400).send({ message: "Missing stripe signature" });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;

    if (!webhookSecret) {
      throw new Error("Missing stripe webhook secret key");
    }

    const raw = (await request.rawBody) as Buffer;

    const event = stripe.webhooks.constructEvent(raw, signature, webhookSecret);

    request.log.info({ eventId: event.id, eventType: event.type }, "Stripe webhook recebido");

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (!orderId || session.payment_status !== "paid") {
          request.log.warn(
            { eventId: event.id, orderId, paymentStatus: session.payment_status },
            "Checkout concluído sem pagamento confirmado ou sem orderId",
          );
          break;
        }

        await prisma.order.update({
          where: {
            id: Number(orderId),
          },
          data: {
            status: "PAID",
          },
        });

        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const orderId = event.data.object.metadata?.orderId;

        if (!orderId) {
          request.log.warn({ eventId: event.id }, "Webhook sem orderId");
          break;
        }

        await prisma.order.update({
          where: { id: Number(orderId) },
          data: { status: "PAID" },
        });

        break;
      }

      case "payment_intent.succeeded": {
        const orderId = event.data.object.metadata?.orderId;

        if (!orderId) {
          request.log.warn({ eventId: event.id }, "Webhook sem orderId");
          break;
        }

        await prisma.order.update({
          where: { id: Number(orderId) },
          data: { status: "PAID" },
        });

        break;
      }

      case "charge.failed": {
        const orderId = event.data.object.metadata?.orderId;

        if (!orderId) {
          request.log.warn({ eventId: event.id }, "Webhook sem orderId");
          break;
        }
        await prisma.order.update({
          where: {
            id: Number(orderId),
          },
          data: {
            status: "CANCELLED",
          },
        });

        break;
      }
    }

    return reply.status(200).send({
      received: true,
    });
  }
}
