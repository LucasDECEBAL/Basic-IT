import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "basic-it-admin";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function adminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

export function isAdminConfigured() {
  return adminPassword().length >= 8;
}

function sign(value: string) {
  const key = createHash("sha256").update(adminPassword()).digest();
  return createHmac("sha256", key).update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export function checkAdminPassword(candidate: string) {
  return isAdminConfigured() && safeEqual(candidate, adminPassword());
}

export function createAdminSession() {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  return `${expiresAt}.${sign(`admin:${expiresAt}`)}`;
}

export function verifyAdminSession(value: string | undefined) {
  if (!value) return false;

  const [expiresRaw, signature] = value.split(".");
  if (!expiresRaw || !signature) return false;

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expected = sign(`admin:${expiresAt}`);
  if (signature.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function isAdminRequest() {
  const store = await cookies();
  return verifyAdminSession(store.get(ADMIN_COOKIE)?.value);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  };
}
