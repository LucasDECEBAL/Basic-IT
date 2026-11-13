import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { deleteBooking, listBookings } from "@/lib/server/booking-store";
import {
  NO_STORE_HEADERS,
  bookingErrorResponse,
  unauthorizedResponse,
} from "@/lib/server/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) return unauthorizedResponse();

  try {
    const { id } = await params;
    const removed = await deleteBooking(id);

    if (!removed) {
      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404, headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(
      { bookings: await listBookings() },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
