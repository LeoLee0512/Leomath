"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { readThemeColors, type ThemeColors } from "@/lib/plot";

const fallback: ThemeColors = {
  paper: "#faf8f3", ink: "#17191e", ink2: "#3a3d44", muted: "#62666e", rule: "#e3dfd5", leo: "#1f5cb8",
  grid: "#d9d3c6", gridStrong: "#b9b2a3", e1: "#b03d27", e2: "#1b6e45", accent2: "#8a6418",
};

// A tiny external store over the <html> class attribute, so light ↔ dark switches re-render consumers.
let cache: ThemeColors | null = null;
const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (!observer) {
    observer = new MutationObserver(() => {
      cache = null;
      listeners.forEach((l) => l());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && observer) {
      observer.disconnect();
      observer = null;
    }
  };
}

function getSnapshot(): ThemeColors {
  if (!cache) cache = readThemeColors();
  return cache;
}

function getServerSnapshot(): ThemeColors {
  return fallback;
}

/** Current CSS theme colours, updated when the html class changes (light ↔ dark). */
export function useThemeColors(): ThemeColors {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Whether dark mode is active, kept in sync with the html class. */
export function useIsDark(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

/** Re-renders when the element is resized. Returns a version number to include in effect deps. */
export function useResizeVersion(ref: React.RefObject<HTMLElement | null>): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setV((x) => x + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return v;
}
