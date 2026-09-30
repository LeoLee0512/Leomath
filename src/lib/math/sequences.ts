/** Sequences for the ε–N experiment, and the search for the N that the definition of a limit asks for. */

export type SequenceId = "ratio" | "alternating" | "sine" | "sign";

export const SEQUENCE_IDS: readonly SequenceId[] = ["ratio", "alternating", "sine", "sign"];

/** aₙ for n = 1, 2, …; `limit` is null when the sequence has none. */
export const sequences: Record<SequenceId, { term: (n: number) => number; limit: number | null }> = {
  ratio: { term: (n) => n / (n + 1), limit: 1 },
  alternating: { term: (n) => 1 + (n % 2 === 0 ? 1 : -1) / n, limit: 1 },
  sine: { term: (n) => 1 + Math.sin(n) / Math.sqrt(n), limit: 1 },
  sign: { term: (n) => (n % 2 === 0 ? 1 : -1), limit: null },
};

/**
 * The last index n ≤ `upTo` with |aₙ − L| ≥ ε, or 0 if every term is inside the band.
 * If the answer is small compared with `upTo`, N = this index works as far as we looked:
 * every later term checked lies within ε of L.
 */
export function lastOutside(term: (n: number) => number, L: number, eps: number, upTo: number): number {
  // Rounding must not pull a term that sits exactly on the edge of the band (1 − 9/10 vs 0.1) inside it.
  const edge = eps * (1 - 1e-12);
  for (let n = upTo; n >= 1; n--) if (Math.abs(term(n) - L) >= edge) return n;
  return 0;
}
