import { FastifyInstance } from "fastify";
import { StripeController } from "../controllers/stripe.controller";
import { StripeWebhookController } from "../controllers/stripe.webhook.controller";
import fastifyRawBody from "fastify-raw-body";

export default async function stripeRoutes(fastify: FastifyInstance) {
  const stripeController = new StripeController();
  const stripeWebhookController = new StripeWebhookController();

  await fastify.register(fastifyRawBody, {
    field: "rawBody", // Request.rawBody
    global: false,
    encoding: false,
    runFirst: true,
  });

  fastify.post(
    "/checkout",
    stripeController.createCheckoutSession.bind(stripeController),
  );

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
