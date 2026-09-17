import "dotenv/config";
import Stripe from "stripe";
import { prisma } from "../utils/prisma";

interface OrderItems {
  id: number;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface createStripeCheckoutServiceRequest {
  products: OrderItems[];
  orderId: number;
  shippingCost: number;
}

export const createStripeCheckoutService = async ({
  products,
  orderId,
  shippingCost,
}: createStripeCheckoutServiceRequest) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing Stripe secret key");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });

  const orderIdValue = String(orderId);
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    metadata: {
      orderId: orderIdValue,
    },
    payment_intent_data: {
      metadata: {
        orderId: orderIdValue,
      },
    },
    line_items: [
      ...products.map((product) => ({
        price_data: {
          currency: "brl" as const,
          unit_amount: Math.round(product.unitPrice * 100),
          product_data: { name: product.name },
        },
        quantity: product.quantity,
      })),
      ...(shippingCost > 0
        ? [{
            price_data: {
              currency: "brl" as const,
              unit_amount: Math.round(shippingCost * 100),
              product_data: { name: "Frete" },
            },
            quantity: 1,
          }]
        : []),
    ],
    success_url: `${process.env.API_URL ?? "http://localhost:3000"}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/cancel`,
  });

  if (!session.url) {
    throw new Error("Stripe não retornou a URL do checkout");
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
};

export const syncOrderFromStripeSession = async (sessionId: string) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing Stripe secret key");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    throw new Error("Stripe session sem orderId");
  }

  if (session.payment_status !== "paid") {
    return {
      orderId: Number(orderId),
      paymentStatus: session.payment_status,
      orderStatus: "PENDING" as const,
    };
  }

  const order = await prisma.order.update({
    where: { id: Number(orderId) },
    data: { status: "PAID" },
    select: { id: true, status: true },
  });

  return {
    orderId: order.id,
    paymentStatus: session.payment_status,
    orderStatus: order.status,
  };
};
