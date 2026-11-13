import { NextResponse } from "next/server";
import {
  BookingStoreError,
  clearBookings,
  createBooking,
  listBookings,
} from "@/lib/server/booking-store";
import { NO_STORE_HEADERS, bookingErrorResponse } from "@/lib/server/http";
import { sendBookingEmails } from "@/lib/server/mailer";


export async function GET() {
  try {
    const bookings = await listBookings();
    return NextResponse.json({ bookings }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Requête invalide." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Requête invalide." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const payload = body as Record<string, unknown>;
    const dateIso = payload.dateIso;
    const time = payload.time;
    const name = payload.name;
    const email = payload.email;
    const phone = payload.phone;

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

    const booking = await createBooking({ dateIso, time, name, email, phone });
    const mail = await sendBookingEmails(booking);

    return NextResponse.json(
      { booking, emailSent: mail.sent, emailSkipped: mail.skipped },
      { status: 201, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return bookingErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    await clearBookings();
    return NextResponse.json({ bookings: [] }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
