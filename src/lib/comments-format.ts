// Pure helpers for rendering comments; safe to import from client and tests.
import type { Locale } from "@/i18n/config";

/** "leo@example.com" → "le***": never show a full email on the site. */
export function maskEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return `${local.slice(0, 2)}***`;
}

export function authorLabel(displayName: string | null, email: string): string {
  const name = displayName?.trim();
  return name ? name : maskEmail(email);
}

export function formatCommentDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

/** Collapse runs of blank lines and trim; the DB enforces the length. */
export function normaliseBody(raw: string): string {
  return raw.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
