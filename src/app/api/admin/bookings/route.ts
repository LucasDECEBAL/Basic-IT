import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { clearBookings, listBookings } from "@/lib/server/booking-store";
import {
  NO_STORE_HEADERS,
  bookingErrorResponse,
  unauthorizedResponse,
} from "@/lib/server/http";

export async function GET() {
  if (!(await isAdminRequest())) return unauthorizedResponse();

  try {
    const bookings = await listBookings();
    return NextResponse.json({ bookings }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}

export async function DELETE() {
  if (!(await isAdminRequest())) return unauthorizedResponse();

  try {
    await clearBookings();
    return NextResponse.json({ bookings: [] }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
