"use client";

import { useSyncExternalStore } from "react";
import type { Booking } from "@/lib/bookings";

type BookingsStatus = "loading" | "ready" | "error";

type BookingsSnapshot = {
  bookings: Booking[];
  status: BookingsStatus;
  error: string | null;
};

const INITIAL: BookingsSnapshot = { bookings: [], status: "loading", error: null };

let snapshot: BookingsSnapshot = INITIAL;
const listeners = new Set<() => void>();

let started = false;
let interval: number | null = null;
let inFlight: Promise<void> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function setSnapshot(next: BookingsSnapshot) {
  snapshot = next;
  emit();
}

async function fetchBookings() {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const response = await fetch("/api/bookings", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { bookings?: Booking[] };
      setSnapshot({
        bookings: Array.isArray(data.bookings) ? data.bookings : [],
        status: "ready",
        error: null,
      });
    } catch {
      setSnapshot({
        ...snapshot,
        status: snapshot.status === "ready" ? "ready" : "error",
        error: "Impossible de joindre le serveur des réservations.",
      });
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

function refreshWhenVisible() {
  if (document.visibilityState === "visible") void fetchBookings();
}

function start() {
  if (started) return;
  started = true;
  void fetchBookings();
  interval = window.setInterval(refreshWhenVisible, 10_000);
  window.addEventListener("focus", refreshWhenVisible);
  document.addEventListener("visibilitychange", refreshWhenVisible);
}

function stop() {
  if (!started) return;
  started = false;
  if (interval !== null) {
    window.clearInterval(interval);
    interval = null;
  }
  window.removeEventListener("focus", refreshWhenVisible);
  document.removeEventListener("visibilitychange", refreshWhenVisible);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return INITIAL;
}

/**
 * Shared client store for the server-backed bookings. One fetch and one poll
 * timer serve every component, so the site and the admin stay in sync.
 */
export function useBookings() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { ...current, refresh: fetchBookings };
}
