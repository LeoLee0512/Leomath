import "server-only";
import { headers } from "next/headers";

/**
 * Failure counters for password checks, kept in memory (the site runs as one Node process).
 * They stop password guessing and keep bcrypt, which is CPU-heavy, from being used to slow the site.
 * nginx applies a coarser per-IP limit in front of this (deploy/nginx.leomath.conf).
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 50_000;

function bucket(key: string, now: number): Bucket | undefined {
  const b = buckets.get(key);
  if (b && b.resetAt <= now) {
    buckets.delete(key);
    return undefined;
  }
  return b;
}

/** Whether `key` has used up `limit` within its current window. */
export function isLimited(key: string, limit: number, now = Date.now()): boolean {
  return (bucket(key, now)?.count ?? 0) >= limit;
}

/** Count one event (a failed attempt, or any attempt for actions that are limited as a whole). */
export function record(key: string, windowMs: number, now = Date.now()): void {
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    // Still full: drop the oldest entries rather than grow without bound.
    for (const k of buckets.keys()) {
      if (buckets.size <= MAX_BUCKETS * 0.9) break;
      buckets.delete(k);
    }
  }
  const b = bucket(key, now);
  if (b) b.count += 1;
  else buckets.set(key, { count: 1, resetAt: now + windowMs });
}

/** Forget a key, e.g. after a successful login. */
export function clear(key: string): void {
  buckets.delete(key);
}

/**
 * The client's address. nginx sets X-Real-IP to the connecting address; X-Forwarded-For's leftmost
 * entries can be forged by the client, so only its last hop is used as a fallback.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return forwarded?.at(-1) ?? "local";
}

export const FIFTEEN_MINUTES = 15 * 60_000;
export const ONE_HOUR = 60 * 60_000;
