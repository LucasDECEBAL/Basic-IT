import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getAvailabilityCounts } from "@/lib/server/booking-store";
import { NO_STORE_HEADERS, bookingErrorResponse } from "@/lib/server/http";

export async function GET() {
  await connection();

  try {
    const slots = await getAvailabilityCounts();
    return NextResponse.json({ slots }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
