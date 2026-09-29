"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Experiment parameters live in the page URL as `?<slug>.<key>=<value>`, so a link reproduces what
 * the sender saw. The server passes the request's query in, so the first render is identical on server
 * and client; client-side mounts (Back/Forward, Reset) read the live URL instead. Changes are written
 * back with history.replaceState(null, …), which Next.js mirrors into its router.
 *
 * Every value from the URL is untrusted: numbers are clamped to the control's range (a value like
 * `n=1e15` would otherwise stall the server while it renders the experiment), strings must be one of
 * the allowed values, and anything unreadable falls back to the default.
 */
export interface ExperimentUrl {
  slug: string;
  /** This experiment's parameters from the request URL, keys without the slug prefix. */
  query: Record<string, string>;
}

export const ExperimentUrlContext = createContext<ExperimentUrl | null>(null);

type Value = number | string | boolean;

export interface NumberRange {
  min: number;
  max: number;
  /** Round to a whole number (counts, orders, group sizes). */
  integer?: boolean;
}

/** Reads one URL value; exported for tests. */
export function parseUrlValue(raw: string | null | undefined, fallback: Value, rule?: NumberRange | readonly string[]): Value {
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof fallback === "number") {
    let n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    if (rule && !Array.isArray(rule)) {
      const r = rule as NumberRange;
      if (r.integer) n = Math.round(n);
      n = Math.min(r.max, Math.max(r.min, n));
    }
    return n;
  }
  if (typeof fallback === "boolean") return raw === "1" ? true : raw === "0" ? false : fallback;
  if (Array.isArray(rule)) return rule.includes(raw) ? raw : fallback;
  return raw.slice(0, 64);
}

function encode(v: Value): string {
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") return String(Math.round(v * 1e6) / 1e6);
  return v;
}

/** The value of one parameter in the live URL (client only). */
function liveParam(name: string): string | null {
  return typeof window === "undefined" ? null : new URL(window.location.href).searchParams.get(name);
}

// Pending writes, batched into one replaceState. They belong to the page they were made on.
const pending = new Map<string, string | null>();
let pendingPath: string | null = null;
let timer: number | null = null;

/** Apply pending writes now. Writes made on another page (the user navigated away within the debounce) are dropped. */
export function flushExperimentUrl() {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
  if (pending.size === 0) return;
  const url = new URL(window.location.href);
  if (url.pathname === pendingPath) {
    for (const [k, v] of pending) {
      if (v === null) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    window.history.replaceState(null, "", url);
  }
  pending.clear();
  pendingPath = null;
}

function scheduleWrite(name: string, value: string | null) {
  if (pendingPath !== null && pendingPath !== window.location.pathname) flushExperimentUrl();
  pendingPath = window.location.pathname;
  pending.set(name, value);
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(flushExperimentUrl, 250);
}

/** Remove every parameter of one experiment from the URL (used by Reset). */
export function clearExperimentUrl(slug: string) {
  for (const k of [...pending.keys()]) if (k.startsWith(`${slug}.`)) pending.delete(k);
  const url = new URL(window.location.href);
  for (const k of [...url.searchParams.keys()]) if (k.startsWith(`${slug}.`)) url.searchParams.delete(k);
  window.history.replaceState(null, "", url);
}

type Setter<T> = (v: T | ((prev: T) => T)) => void;

/**
 * useState that is initialised from, and mirrored to, the URL. Outside an experiment frame
 * (e.g. the home-page hero) it behaves like plain useState.
 */
export function useUrlState(key: string, initial: number, range: NumberRange): [number, Setter<number>];
export function useUrlState(key: string, initial: boolean): [boolean, Setter<boolean>];
/** Free text (at most 64 characters); the caller must validate what it reads. */
export function useUrlState(key: string, initial: string): [string, Setter<string>];
export function useUrlState<T extends string>(key: string, initial: T, allowed: readonly T[]): [T, Setter<T>];
export function useUrlState<T extends Value>(key: string, initial: T, rule?: NumberRange | readonly string[]): [T, Setter<T>] {
  const ctx = useContext(ExperimentUrlContext);
  const name = ctx ? `${ctx.slug}.${key}` : "";
  const [value, setValue] = useState<T>(() => {
    if (!ctx) return initial;
    // On the server, and while hydrating the first page load, the request query and the live URL agree.
    // On a client-side mount (Back/Forward) only the live URL is current.
    const raw = typeof window === "undefined" ? ctx.query[key] : liveParam(name);
    return parseUrlValue(raw, initial, rule) as T;
  });
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!ctx) return;
    // Defaults are left out, so an untouched experiment adds nothing to the URL.
    scheduleWrite(name, value === initial ? null : encode(value));
  }, [ctx, name, value, initial]);
  const set = useCallback((v: T | ((prev: T) => T)) => setValue(v), []);
  return [value, set];
}
