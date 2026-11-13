import "server-only";

import Stripe from "stripe";

let client: Stripe | null = null;

export class StripeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeConfigError";
  }
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();

  if (!key) {
    throw new StripeConfigError("STRIPE_SECRET_KEY n'est pas configurée.");
  }

  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
    throw new StripeConfigError(
      "Seules les clés Stripe de test sont acceptées sur cette démo.",
    );
  }

  client ??= new Stripe(key, {
    appInfo: { name: "Basic IT", version: "1.0.0" },
  });

  return client;
}

export function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secret) {
    throw new StripeConfigError("STRIPE_WEBHOOK_SECRET n'est pas configuré.");
  }

  return secret;
}

export function appUrl(path: string) {
  const base = (process.env.APP_URL?.trim() || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
