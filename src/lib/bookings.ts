export type BookingFormat = "force" | "cardio" | "mobilite";

export type BookingStatus = "confirmed" | "pending" | "expired" | "cancelled";

export type Booking = {
  id: string;
  code: string;
  slotId: string;
  dateIso: string;
  dateLong: string;
  time: string;
  format: BookingFormat;
  course: string;
  coach: string;
  duration: number;
  price: number;
  name: string;
  email: string;
  phone: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
};

export const BOOKING_STATUSES: BookingStatus[] = [
  "confirmed",
  "pending",
  "expired",
  "cancelled",
];

/** A confirmed booking, or a pending one that still holds its seat. */
export function isActiveBooking(booking: Booking) {
  return booking.status === "confirmed" || booking.status === "pending";
}

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && BOOKING_STATUSES.includes(value as BookingStatus);
}

export function isBookingFormat(value: unknown): value is BookingFormat {
  return value === "force" || value === "cardio" || value === "mobilite";
}
