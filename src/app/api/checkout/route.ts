import { NextResponse } from "next/server";
import {
  BookingStoreError,
  attachStripeSession,
  cancelPendingBooking,
  createPendingBooking,
} from "@/lib/server/booking-store";
import {
  NO_STORE_HEADERS,
  bookingErrorResponse,
} from "@/lib/server/http";
import {
  StripeConfigError,
  appUrl,
  getStripe,
} from "@/lib/server/stripe";

const HOLD_MINUTES = 35;
const SESSION_MINUTES = 31;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!body) {
      return NextResponse.json(
        { error: "Requête invalide." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const { dateIso, time, name, email, phone } = body;

    if (
      typeof dateIso !== "string" ||
      typeof time !== "string" ||
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string"
    ) {
      throw new BookingStoreError(
        "Les informations de réservation sont incomplètes.",
        "INVALID",
        400,
      );
    }

    const booking = await createPendingBooking(
      { dateIso, time, name, email, phone },
      HOLD_MINUTES,
    );

    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        locale: "fr",
        customer_email: booking.email,
        client_reference_id: booking.id,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: booking.price * 100,
              product_data: {
                name: `Séance ${booking.course}`,
                description: `${booking.dateLong} · ${booking.time} · ${booking.coach}`,
              },
            },
          },
        ],
        metadata: {
          bookingId: booking.id,
          code: booking.code,
        },
        payment_intent_data: {
          metadata: {
            bookingId: booking.id,
            code: booking.code,
          },
        },
        success_url: appUrl(
          `/reservation/${booking.id}?session_id={CHECKOUT_SESSION_ID}`,
        ),
        cancel_url: appUrl("/#reserver"),
        expires_at:
          Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
      });

      if (!session.url) {
        throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
      }

      await attachStripeSession(booking.id, session.id);

      return NextResponse.json(
        { url: session.url },
        { status: 201, headers: NO_STORE_HEADERS },
      );
    } catch (error) {
      await cancelPendingBooking(booking.id);
      throw error;
    }
  } catch (error) {
    if (error instanceof StripeConfigError) {
      console.error("[stripe] configuration :", error.message);
      return NextResponse.json(
        {
          error:
            "Le paiement Stripe n'est pas configuré. Ajoutez STRIPE_SECRET_KEY en mode test.",
        },
        { status: 503, headers: NO_STORE_HEADERS },
      );
    }

    if (error instanceof BookingStoreError) {
      return bookingErrorResponse(error);
    }

    console.error(
      "[checkout] création de session impossible :",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Stripe n'a pas pu créer la session de paiement." },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}
