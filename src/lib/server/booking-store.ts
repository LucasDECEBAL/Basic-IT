import "server-only";

import { randomInt, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  isActiveBooking,
  isBookingFormat,
  isBookingStatus,
  type Booking,
} from "@/lib/bookings";
import {
  CAPACITY,
  FORMATS,
  PRICE,
  SESSION_TEMPLATES,
  demoBooked,
  type FormatKey,
} from "@/lib/sessions";

const DATA_FILE = process.env.BOOKINGS_FILE
  ? path.resolve(process.env.BOOKINGS_FILE)
  : path.join(process.cwd(), "data", "bookings.json");
const DATA_DIR = path.dirname(DATA_FILE);
const LOCK_FILE = `${DATA_FILE}.lock`;

const LOCK_TIMEOUT_MS = 5_000;
const LOCK_STALE_MS = 10_000;
const INACTIVE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

type StoreFile = {
  version: 1;
  bookings: Booking[];
};

export type CreateBookingInput = {
  dateIso: string;
  time: string;
  name: string;
  email: string;
  phone: string;
};

export class BookingStoreError extends Error {
  constructor(
    message: string,
    readonly code: "INVALID" | "SLOT_FULL" | "LOCK_TIMEOUT" | "NOT_FOUND",
    readonly status: number,
  ) {
    super(message);
    this.name = "BookingStoreError";
  }
}

function invalid(message: string) {
  return new BookingStoreError(message, "INVALID", 400);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeBooking(value: unknown): Booking | null {
  if (!isRecord(value)) return null;
  if (!isBookingFormat(value.format)) return null;

  const createdAt = text(value.createdAt) || new Date(0).toISOString();
  const id = text(value.id);
  const code = text(value.code);
  const slotId = text(value.slotId);
  const dateIso = text(value.dateIso);
  const time = text(value.time);
  const name = text(value.name);
  const email = text(value.email);
  const phone = text(value.phone);

  if (!id || !code || !slotId || !dateIso || !time || !name || !email || !phone) {
    return null;
  }

  return {
    id,
    code,
    slotId,
    dateIso,
    dateLong: text(value.dateLong),
    time,
    format: value.format,
    course: text(value.course),
    coach: text(value.coach),
    duration: typeof value.duration === "number" ? value.duration : 50,
    price: typeof value.price === "number" ? value.price : PRICE,
    name,
    email,
    phone,
    status: isBookingStatus(value.status) ? value.status : "confirmed",
    createdAt,
    updatedAt: text(value.updatedAt) || createdAt,
    expiresAt: text(value.expiresAt) || null,
    stripeSessionId: text(value.stripeSessionId) || null,
    stripePaymentIntentId: text(value.stripePaymentIntentId) || null,
  };
}

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.bookings)) {
      throw new Error("Format de fichier invalide.");
    }
    const bookings = parsed.bookings
      .map(normalizeBooking)
      .filter((booking): booking is Booking => booking !== null);
    return { version: 1, bookings };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, bookings: [] };
    }
    throw error;
  }
}

async function writeStore(store: StoreFile) {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const tempFile = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  const payload = `${JSON.stringify(store, null, 2)}\n`;
  const handle = await fs.open(tempFile, "w");

  try {
    await handle.writeFile(payload, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }

  try {
    // Rename is atomic on the same filesystem: readers see either the old file
    // or the new one, never a half-written file.
    await fs.rename(tempFile, DATA_FILE);
  } catch (error) {
    await fs.unlink(tempFile).catch(() => {});
    throw error;
  }
}

async function acquireFileLock() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const startedAt = Date.now();

  for (;;) {
    try {
      const handle = await fs.open(LOCK_FILE, "wx");
      await handle.writeFile(JSON.stringify({ pid: process.pid, at: Date.now() }));
      let released = false;
      return async () => {
        if (released) return;
        released = true;
        await handle.close().catch(() => {});
        await fs.unlink(LOCK_FILE).catch(() => {});
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;

      const stat = await fs.stat(LOCK_FILE).catch(() => null);
      if (stat && Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
        await fs.unlink(LOCK_FILE).catch(() => {});
        continue;
      }

      if (Date.now() - startedAt > LOCK_TIMEOUT_MS) {
        throw new BookingStoreError(
          "Le studio reçoit trop de demandes. Réessayez dans un instant.",
          "LOCK_TIMEOUT",
          503,
        );
      }

      await sleep(25 + Math.random() * 40);
    }
  }
}

let queue: Promise<unknown> = Promise.resolve();

async function runExclusive<T>(task: () => Promise<T>) {
  const release = await acquireFileLock();
  try {
    return await task();
  } finally {
    await release();
  }
}

/**
 * Serialises mutations in this process, then takes an OS lock file so two
 * processes (dev and prod servers, for example) cannot write at the same time.
 */
export function withStoreLock<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(
    () => runExclusive(task),
    () => runExclusive(task),
  );
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function sweep(store: StoreFile, now = Date.now()) {
  let changed = false;
  const retentionCutoff = now - INACTIVE_RETENTION_MS;
  const next: Booking[] = [];

  for (const booking of store.bookings) {
    if (
      booking.status === "pending" &&
      booking.expiresAt &&
      new Date(booking.expiresAt).getTime() <= now
    ) {
      next.push({
        ...booking,
        status: "expired",
        updatedAt: new Date(now).toISOString(),
      });
      changed = true;
      continue;
    }

    if (
      !isActiveBooking(booking) &&
      new Date(booking.updatedAt).getTime() < retentionCutoff
    ) {
      changed = true;
      continue;
    }

    next.push(booking);
  }

  if (changed) store.bookings = next;
  return changed;
}

type SlotDefinition = {
  dateIso: string;
  dateLong: string;
  time: string;
  slotId: string;
  slotIndex: number;
  dayIndex: number;
  format: FormatKey;
  course: string;
  coach: string;
  duration: number;
};

function resolveSlot(dateIso: string, time: string): SlotDefinition {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    throw invalid("La date du créneau est invalide.");
  }

  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw invalid("La date du créneau est invalide.");
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfSlot = new Date(year, month - 1, day, 0, 0, 0);
  const dayIndex = Math.round(
    (startOfSlot.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (dayIndex < 0 || dayIndex > 6) {
    throw invalid("Cette date n'est pas ouverte à la réservation.");
  }

  if (date.getDay() === 0) {
    throw invalid("Le studio est fermé le dimanche.");
  }

  const slotIndex = SESSION_TEMPLATES.findIndex((session) => session.time === time);
  if (slotIndex === -1) {
    throw invalid("Ce créneau n'existe pas.");
  }

  const format = SESSION_TEMPLATES[slotIndex].format;
  const definition = FORMATS[format];
  const longLabel = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return {
    dateIso,
    dateLong: longLabel.charAt(0).toUpperCase() + longLabel.slice(1),
    time,
    slotId: `${dateIso}-${slotIndex}`,
    slotIndex,
    dayIndex,
    format,
    course: definition.name,
    coach: definition.coach,
    duration: definition.duration,
  };
}

function validateContact(input: CreateBookingInput) {
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();

  if (name.length < 2 || name.length > 80) {
    throw invalid("Indiquez un nom complet valide.");
  }
  if (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw invalid("Indiquez un email valide.");
  }
  if (phone.length > 30 || phone.replace(/\D/g, "").length < 10) {
    throw invalid("Indiquez un téléphone valide.");
  }

  return { name, email, phone };
}

function makeCode(existing: Set<string>) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = "BIT-2027-";
    for (let index = 0; index < 3; index += 1) {
      code += alphabet[randomInt(alphabet.length)];
    }
    if (!existing.has(code)) return code;
  }

  return `BIT-2027-${randomUUID().slice(0, 4).toUpperCase()}`;
}

export async function listBookings(): Promise<Booking[]> {
  return withStoreLock(async () => {
    const store = await readStore();
    if (sweep(store)) {
      await writeStore(store);
    }
    return store.bookings.filter(isActiveBooking);
  });
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const slot = resolveSlot(input.dateIso, input.time);
  const contact = validateContact(input);

  return withStoreLock(async () => {
    const store = await readStore();
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    if (sweep(store, now)) {
      await writeStore(store);
    }

    const activeForSlot = store.bookings.filter(
      (booking) => booking.slotId === slot.slotId && isActiveBooking(booking),
    );
    const baseline = demoBooked(slot.dateIso, slot.slotIndex);

    if (baseline + activeForSlot.length >= CAPACITY) {
      throw new BookingStoreError("Ce créneau est complet.", "SLOT_FULL", 409);
    }

    const booking: Booking = {
      id: randomUUID(),
      code: makeCode(new Set(store.bookings.map((item) => item.code))),
      slotId: slot.slotId,
      dateIso: slot.dateIso,
      dateLong: slot.dateLong,
      time: slot.time,
      format: slot.format,
      course: slot.course,
      coach: slot.coach,
      duration: slot.duration,
      price: PRICE,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      status: "confirmed",
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: null,
      stripeSessionId: null,
      stripePaymentIntentId: null,
    };

    store.bookings.push(booking);
    await writeStore(store);
    return booking;
  });
}

export async function deleteBooking(id: string): Promise<boolean> {
  return withStoreLock(async () => {
    const store = await readStore();
    const booking = store.bookings.find((item) => item.id === id);
    if (!booking) return false;

    if (booking.status === "pending") {
      throw new BookingStoreError(
        "Cette réservation attend un paiement. Elle se libérera automatiquement.",
        "INVALID",
        409,
      );
    }

    store.bookings = store.bookings.filter((item) => item.id !== id);
    await writeStore(store);
    return true;
  });
}

export async function clearBookings(): Promise<void> {
  await withStoreLock(async () => {
    const store = await readStore();
    if (store.bookings.some((booking) => booking.status === "pending")) {
      throw new BookingStoreError(
        "Des paiements sont en attente. Attendez leur confirmation ou leur expiration.",
        "INVALID",
        409,
      );
    }
    store.bookings = [];
    await writeStore(store);
  });
}

export async function getAvailabilityCounts(): Promise<Record<string, number>> {
  return withStoreLock(async () => {
    const store = await readStore();
    if (sweep(store)) {
      await writeStore(store);
    }

    const counts: Record<string, number> = {};
    for (const booking of store.bookings) {
      if (!isActiveBooking(booking)) continue;
      counts[booking.slotId] = (counts[booking.slotId] ?? 0) + 1;
    }
    return counts;
  });
}

export async function getBookingById(id: string): Promise<Booking | null> {
  return withStoreLock(async () => {
    const store = await readStore();
    if (sweep(store)) {
      await writeStore(store);
    }
    return store.bookings.find((booking) => booking.id === id) ?? null;
  });
}

export async function createPendingBooking(
  input: CreateBookingInput,
  holdMinutes = 31,
): Promise<Booking> {
  const slot = resolveSlot(input.dateIso, input.time);
  const contact = validateContact(input);

  return withStoreLock(async () => {
    const store = await readStore();
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    if (sweep(store, now)) {
      await writeStore(store);
    }

    const activeForSlot = store.bookings.filter(
      (booking) => booking.slotId === slot.slotId && isActiveBooking(booking),
    );
    const baseline = demoBooked(slot.dateIso, slot.slotIndex);

    if (baseline + activeForSlot.length >= CAPACITY) {
      throw new BookingStoreError("Ce créneau est complet.", "SLOT_FULL", 409);
    }

    const booking: Booking = {
      id: randomUUID(),
      code: makeCode(new Set(store.bookings.map((item) => item.code))),
      slotId: slot.slotId,
      dateIso: slot.dateIso,
      dateLong: slot.dateLong,
      time: slot.time,
      format: slot.format,
      course: slot.course,
      coach: slot.coach,
      duration: slot.duration,
      price: PRICE,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      status: "pending",
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: new Date(now + holdMinutes * 60 * 1000).toISOString(),
      stripeSessionId: null,
      stripePaymentIntentId: null,
    };

    store.bookings.push(booking);
    await writeStore(store);
    return booking;
  });
}

export async function attachStripeSession(
  bookingId: string,
  sessionId: string,
): Promise<Booking | null> {
  return withStoreLock(async () => {
    const store = await readStore();
    const booking = store.bookings.find(
      (item) => item.id === bookingId && item.status === "pending",
    );
    if (!booking) return null;

    booking.stripeSessionId = sessionId;
    booking.updatedAt = new Date().toISOString();
    await writeStore(store);
    return booking;
  });
}

export async function cancelPendingBooking(bookingId: string): Promise<void> {
  await withStoreLock(async () => {
    const store = await readStore();
    const before = store.bookings.length;
    store.bookings = store.bookings.filter(
      (booking) => !(booking.id === bookingId && booking.status === "pending"),
    );
    if (store.bookings.length !== before) {
      await writeStore(store);
    }
  });
}

export type ConfirmBookingResult = {
  booking: Booking | null;
  newlyConfirmed: boolean;
};

export async function confirmBookingBySession(
  sessionId: string,
  paymentIntentId: string | null,
  bookingId?: string,
): Promise<ConfirmBookingResult> {
  return withStoreLock(async () => {
    const store = await readStore();
    const now = Date.now();

    if (sweep(store, now)) {
      await writeStore(store);
    }

    const booking = store.bookings.find(
      (item) =>
        (bookingId && item.id === bookingId) ||
        (item.stripeSessionId && item.stripeSessionId === sessionId),
    );

    if (!booking) {
      return { booking: null, newlyConfirmed: false };
    }

    if (booking.status === "confirmed") {
      return { booking, newlyConfirmed: false };
    }

    if (booking.status !== "pending") {
      const slotIndex = Number(booking.slotId.split("-").pop() ?? "0");
      const activeForSlot = store.bookings.filter(
        (item) => item.slotId === booking.slotId && isActiveBooking(item),
      );
      const baseline = demoBooked(booking.dateIso, slotIndex);
      if (baseline + activeForSlot.length >= CAPACITY) {
        return { booking, newlyConfirmed: false };
      }
    }

    booking.status = "confirmed";
    booking.expiresAt = null;
    booking.stripeSessionId = sessionId || booking.stripeSessionId;
    booking.stripePaymentIntentId = paymentIntentId;
    booking.updatedAt = new Date(now).toISOString();
    await writeStore(store);

    return { booking, newlyConfirmed: true };
  });
}

export async function expireBookingBySession(
  sessionId: string,
  bookingId?: string,
): Promise<Booking | null> {
  return withStoreLock(async () => {
    const store = await readStore();
    const booking = store.bookings.find(
      (item) =>
        (bookingId && item.id === bookingId) ||
        (item.stripeSessionId && item.stripeSessionId === sessionId),
    );

    if (!booking) return null;

    if (booking.status === "pending") {
      booking.status = "expired";
      booking.updatedAt = new Date().toISOString();
      await writeStore(store);
    }

    return booking;
  });
}
