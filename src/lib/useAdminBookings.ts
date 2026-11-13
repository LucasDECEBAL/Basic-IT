"use client";

import type { Booking } from "@/lib/bookings";
import { createPolledStore } from "@/lib/polled-store";

const store = createPolledStore<Booking[]>("/api/admin/bookings", [], (value) => {
  if (!value || typeof value !== "object") return [];
  const bookings = (value as { bookings?: unknown }).bookings;
  return Array.isArray(bookings) ? (bookings as Booking[]) : [];
});

export const useAdminBookings = store.useStore;
