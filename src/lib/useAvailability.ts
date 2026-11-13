"use client";

import { createPolledStore } from "@/lib/polled-store";

export type Availability = Record<string, number>;

const store = createPolledStore<Availability>("/api/bookings", {}, (value) => {
  if (!value || typeof value !== "object") return {};
  const slots = (value as { slots?: unknown }).slots;
  if (!slots || typeof slots !== "object" || Array.isArray(slots)) return {};

  const counts: Availability = {};
  for (const [slotId, count] of Object.entries(slots)) {
    if (typeof count === "number" && count > 0) counts[slotId] = count;
  }
  return counts;
});

export const useAvailability = store.useStore;
