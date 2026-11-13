import "server-only";

import { NextResponse } from "next/server";
import { BookingStoreError } from "@/lib/server/booking-store";

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export function bookingErrorResponse(error: unknown) {
  if (error instanceof BookingStoreError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status, headers: NO_STORE_HEADERS },
    );
  }

  console.error("[bookings] unexpected error", error);
  return NextResponse.json(
    { error: "Impossible de traiter la demande." },
    { status: 500, headers: NO_STORE_HEADERS },
  );
}
