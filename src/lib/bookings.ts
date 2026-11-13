export type BookingFormat = "force" | "cardio" | "mobilite";

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
  createdAt: string;
};

const STORAGE_KEY = "basic-it.bookings.v1";
const EMPTY: Booking[] = [];
const listeners = new Set<() => void>();

let cache: Booking[] | null = null;

function isBooking(value: unknown): value is Booking {
  if (!value || typeof value !== "object") return false;
  const booking = value as Record<string, unknown>;
  return (
    typeof booking.id === "string" &&
    typeof booking.code === "string" &&
    typeof booking.slotId === "string" &&
    typeof booking.dateIso === "string" &&
    typeof booking.dateLong === "string" &&
    typeof booking.time === "string" &&
    typeof booking.format === "string" &&
    typeof booking.course === "string" &&
    typeof booking.coach === "string" &&
    typeof booking.duration === "number" &&
    typeof booking.price === "number" &&
    typeof booking.name === "string" &&
    typeof booking.email === "string" &&
    typeof booking.phone === "string" &&
    typeof booking.createdAt === "string"
  );
}

function read(): Booking[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isBooking);
  } catch {
    return EMPTY;
  }
}

function write(next: Booking[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode, quota). The session still works.
  }
  listeners.forEach((listener) => listener());
}

export function getBookingsSnapshot(): Booking[] {
  cache ??= read();
  return cache;
}

export function getBookingsServerSnapshot(): Booking[] {
  return EMPTY;
}

export function subscribeToBookings(listener: () => void) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };

  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function addBooking(booking: Booking) {
  write([...getBookingsSnapshot(), booking]);
}

export function removeBooking(id: string) {
  write(getBookingsSnapshot().filter((booking) => booking.id !== id));
}

export function clearBookings() {
  write([]);
}

export function makeBookingId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
