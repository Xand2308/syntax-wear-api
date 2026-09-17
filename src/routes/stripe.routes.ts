import { FastifyInstance } from "fastify";
import { StripeController } from "../controllers/stripe.controller";
import { StripeWebhookController } from "../controllers/stripe.webhook.controller";
import { authenticateIfPresent } from "../middlewares/auth.middleware";
import fastifyRawBody from "fastify-raw-body";

export default async function stripeRoutes(fastify: FastifyInstance) {
  const stripeController = new StripeController();
  const stripeWebhookController = new StripeWebhookController();

  fastify.post(
    "/checkout",
    {
      onRequest: authenticateIfPresent,
      schema: {
        tags: ["Stripe"],
        description: "Cria um pedido guest ou abre uma sessão de pagamento Stripe",
        response: {
          200: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
              checkoutUrl: { type: "string", nullable: true },
              url: { type: "string", nullable: true },
            },
          },
        },
      },
    },
    stripeController.createCheckoutSession.bind(stripeController),
  );

  await fastify.register(fastifyRawBody, {
    field: "rawBody", // Request.rawBody
    global: false,
    encoding: false,
    runFirst: true,
  });

  fastify.get(
    "/success",
    stripeController.completeCheckout.bind(stripeController),
  );

  fastify.get(
    "/status/:sessionId",
    stripeController.syncCheckout.bind(stripeController),
  );

  fastify.post(
    "/webhook",
    {
      config: {
        rawBody: true,
      },
    },
    stripeWebhookController.handle.bind(stripeWebhookController),
  );
}
