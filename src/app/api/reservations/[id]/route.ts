import { NextResponse } from "next/server";
import {
  confirmBookingBySession,
  expireBookingBySession,
  getBookingById,
} from "@/lib/server/booking-store";
import { NO_STORE_HEADERS } from "@/lib/server/http";
import { sendBookingEmails } from "@/lib/server/mailer";
import { StripeConfigError, getStripe } from "@/lib/server/stripe";

function paymentIntentId(session: {
  payment_intent: string | { id: string } | null;
}) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : (session.payment_intent?.id ?? null);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404, headers: NO_STORE_HEADERS },
      );
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");

    // Fallback when the webhook is delayed: Stripe Checkout has already
    // redirected the visitor here, so we can verify the session ourselves.
    if (booking.status === "pending" && sessionId) {
      try {
        const session = await getStripe().checkout.sessions.retrieve(sessionId);
        const belongsToBooking =
          session.id === booking.stripeSessionId ||
          session.metadata?.bookingId === booking.id;

        if (belongsToBooking) {
          if (
            session.payment_status === "paid" ||
            session.payment_status === "no_payment_required"
          ) {
            const result = await confirmBookingBySession(
              session.id,
              paymentIntentId(session),
              booking.id,
            );
            if (result.booking) booking = result.booking;

            if (result.booking && result.newlyConfirmed) {
              try {
                await sendBookingEmails(result.booking);
              } catch (error) {
                console.error(
                  "[reservation] email de confirmation :",
                  error instanceof Error ? error.message : error,
                );
              }
            }
          } else if (session.status === "expired") {
            const expired = await expireBookingBySession(session.id, booking.id);
            if (expired) booking = expired;
          }
        }
      } catch (error) {
        // The stored status stays authoritative; the page keeps polling.
        if (!(error instanceof StripeConfigError)) {
          console.error(
            "[reservation] vérification Stripe :",
            error instanceof Error ? error.message : error,
          );
        }
      }
    }

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          code: booking.code,
          status: booking.status,
          course: booking.course,
          coach: booking.coach,
          dateLong: booking.dateLong,
          time: booking.time,
          price: booking.price,
          name: booking.name,
          email: booking.email,
        },
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error(
      "[reservation] lecture impossible :",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Impossible de lire la réservation." },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
