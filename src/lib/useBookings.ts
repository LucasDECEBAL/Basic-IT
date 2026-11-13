"use client";

import { useSyncExternalStore } from "react";
import {
  getBookingsServerSnapshot,
  getBookingsSnapshot,
  subscribeToBookings,
} from "@/lib/bookings";

export function useBookings() {
  return useSyncExternalStore(
    subscribeToBookings,
    getBookingsSnapshot,
    getBookingsServerSnapshot,
  );
}
