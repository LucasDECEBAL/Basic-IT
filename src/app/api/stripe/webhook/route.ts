import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  confirmBookingBySession,
  expireBookingBySession,
} from "@/lib/server/booking-store";
import { sendBookingEmails } from "@/lib/server/mailer";
import { NO_STORE_HEADERS } from "@/lib/server/http";
import {
  StripeConfigError,
  getStripe,
  getWebhookSecret,
} from "@/lib/server/stripe";

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : (session.payment_intent?.id ?? null);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Signature manquante." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      getWebhookSecret(),
    );
  } catch (error) {
    if (error instanceof StripeConfigError) {
      console.error("[stripe] webhook :", error.message);
      return NextResponse.json(
        { error: "Webhook Stripe non configuré." },
        { status: 500 },
      );
    }

    console.error(
      "[stripe] signature invalide :",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Signature invalide." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (
          session.payment_status !== "paid" &&
          session.payment_status !== "no_payment_required"
        ) {
          break;
        }

        const result = await confirmBookingBySession(
          session.id,
          paymentIntentId(session),
          session.metadata?.bookingId,
        );

        if (result.booking && result.newlyConfirmed) {
          try {
            await sendBookingEmails(result.booking);
          } catch (error) {
            console.error(
              "[stripe] email de confirmation :",
              error instanceof Error ? error.message : error,
            );
          }
        }
        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await expireBookingBySession(
          session.id,
          session.metadata?.bookingId,
        );
        break;
      }

      default:
        break;
    }

    return NextResponse.json(
      { received: true },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error(
      "[stripe] webhook :",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Traitement impossible." },
      { status: 500 },
    );
  }
}
