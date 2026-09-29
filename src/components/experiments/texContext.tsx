"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Server-rendered formula HTML for the experiment in scope, keyed as in src/content/experiment-tex.ts. */
const ExperimentTexContext = createContext<Record<string, string>>({});

export function TexProvider({ html, children }: { html: Record<string, string>; children: ReactNode }) {
  return <ExperimentTexContext.Provider value={html}>{children}</ExperimentTexContext.Provider>;
}

/** A formula as HTML, ready for dangerouslySetInnerHTML; "" if the server did not provide it. */
export function useTex(key: string): string {
  return useContext(ExperimentTexContext)[key] ?? "";
}
