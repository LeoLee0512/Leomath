/**
 * A small, safe mathematical expression language for the tools and experiments.
 *
 *   expr    := term (("+" | "-") term)*
 *   term    := unary (("*" | "/" | implicit) unary)*
 *   unary   := "-" unary | power
 *   power   := postfix ("^" unary)?            right-associative; -x^2 = -(x^2)
 *   postfix := primary ("²" | "³")*
 *   primary := number | name | name "(" args ")" | "(" expr ")"
 *
 * Implicit multiplication is allowed only between a number or ")" and a name or "(":
 * "2x", "2(x+1)", "(x+1)(x-1)". Two adjacent numbers ("2 3") are an error, and
 * "1e3" is the number 1000, never "1·e3". Names are read greedily, so "ex" is one
 * unknown name, not e·x.
 */

export type Expr =
  | { type: "num"; value: number }
  | { type: "var"; name: string }
  | { type: "call"; name: string; args: Expr[] }
  | { type: "bin"; op: "+" | "-" | "*" | "/" | "^"; left: Expr; right: Expr }
  | { type: "neg"; arg: Expr };

export type ExprErrorCode = "unexpected" | "unknown-name" | "arity" | "unclosed" | "empty";

export class ExprError extends Error {
  constructor(public code: ExprErrorCode, public pos: number, public detail: string) {
    super(`${code} at ${pos}: ${detail}`);
    this.name = "ExprError";
  }
}

export const FUNCTIONS: Record<string, { fn: (...a: number[]) => number; arity: number | [number, number] }> = {
  sin: { fn: Math.sin, arity: 1 }, cos: { fn: Math.cos, arity: 1 }, tan: { fn: Math.tan, arity: 1 },
  asin: { fn: Math.asin, arity: 1 }, acos: { fn: Math.acos, arity: 1 }, atan: { fn: Math.atan, arity: 1 },
  atan2: { fn: Math.atan2, arity: 2 },
  sinh: { fn: Math.sinh, arity: 1 }, cosh: { fn: Math.cosh, arity: 1 }, tanh: { fn: Math.tanh, arity: 1 },
  exp: { fn: Math.exp, arity: 1 }, ln: { fn: Math.log, arity: 1 }, log: { fn: Math.log10, arity: 1 },
  log2: { fn: Math.log2, arity: 1 }, sqrt: { fn: Math.sqrt, arity: 1 }, cbrt: { fn: Math.cbrt, arity: 1 },
  abs: { fn: Math.abs, arity: 1 }, floor: { fn: Math.floor, arity: 1 }, ceil: { fn: Math.ceil, arity: 1 },
  round: { fn: Math.round, arity: 1 }, sign: { fn: Math.sign, arity: 1 },
  min: { fn: Math.min, arity: [1, 16] }, max: { fn: Math.max, arity: [1, 16] },
  gamma: { fn: gamma, arity: 1 },
};

export const CONSTANTS: Record<string, number> = { pi: Math.PI, π: Math.PI, e: Math.E, tau: 2 * Math.PI };

type Token =
  | { t: "num"; v: number; pos: number }
  | { t: "name"; v: string; pos: number }
  | { t: "op"; v: string; pos: number }
  | { t: "end"; pos: number };

const NAME_START = /[A-Za-z_Ͱ-Ͽ]/;
const NAME_CHAR = /[A-Za-z0-9_Ͱ-Ͽ]/;

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === " " || ch === "\t" || ch === "\n") { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
      if (!m || m[0] === ".") throw new ExprError("unexpected", i, ch);
      out.push({ t: "num", v: Number(m[0]), pos: i });
      i += m[0].length;
      continue;
    }
    if (NAME_START.test(ch)) {
      let j = i + 1;
      while (j < src.length && NAME_CHAR.test(src[j])) j++;
      out.push({ t: "name", v: src.slice(i, j), pos: i });
      i = j;
      continue;
    }
    const norm = ch === "×" || ch === "·" ? "*" : ch === "÷" ? "/" : ch === "−" ? "-" : ch;
    if ("+-*/^(),²³".includes(norm)) {
      out.push({ t: "op", v: norm, pos: i });
      i++;
      continue;
    }
    throw new ExprError("unexpected", i, ch);
  }
  out.push({ t: "end", pos: src.length });
  return out;
}

export function parse(src: string): Expr {
  const tokens = tokenize(src);
  let k = 0;
  const peek = () => tokens[k];
  const next = () => tokens[k++];
  const isOp = (v: string) => peek().t === "op" && (peek() as { v: string }).v === v;

  function expr(): Expr {
    let left = term();
    while (isOp("+") || isOp("-")) {
      const op = (next() as { v: "+" | "-" }).v;
      left = { type: "bin", op, left, right: term() };
    }
    return left;
  }
  function term(): Expr {
    let left = unary();
    for (;;) {
      if (isOp("*") || isOp("/")) {
        const op = (next() as { v: "*" | "/" }).v;
        left = { type: "bin", op, left, right: unary() };
      } else if (peek().t === "name" || isOp("(")) {
        // implicit multiplication: only after a number, ")" or a postfix square
        const prev = tokens[k - 1];
        const allowed = prev && (prev.t === "num" || (prev.t === "op" && (prev.v === ")" || prev.v === "²" || prev.v === "³")));
        if (!allowed) break;
        left = { type: "bin", op: "*", left, right: unary() };
      } else break;
    }
    return left;
  }
  function unary(): Expr {
    if (isOp("-")) { next(); return { type: "neg", arg: unary() }; }
    if (isOp("+")) { next(); return unary(); }
    return power();
  }
  function power(): Expr {
    const base = postfix();
    if (isOp("^")) { next(); return { type: "bin", op: "^", left: base, right: unary() }; }
    return base;
  }
  function postfix(): Expr {
    let e = primary();
    while (isOp("²") || isOp("³")) {
      const v = (next() as { v: string }).v;
      e = { type: "bin", op: "^", left: e, right: { type: "num", value: v === "²" ? 2 : 3 } };
    }
    return e;
  }
  function primary(): Expr {
    const tok = next();
    if (tok.t === "num") return { type: "num", value: tok.v };
    if (tok.t === "name") {
      if (isOp("(")) {
        const open = next();
        const args: Expr[] = [];
        if (!isOp(")")) {
          args.push(expr());
          while (isOp(",")) { next(); args.push(expr()); }
        }
        if (!isOp(")")) throw new ExprError("unclosed", open.pos, "(");
        next();
        const f = FUNCTIONS[tok.v];
        if (!f) throw new ExprError("unknown-name", tok.pos, tok.v);
        const [lo, hi] = Array.isArray(f.arity) ? f.arity : [f.arity, f.arity];
        if (args.length < lo || args.length > hi) throw new ExprError("arity", tok.pos, `${tok.v}/${args.length}`);
        return { type: "call", name: tok.v, args };
      }
      if (FUNCTIONS[tok.v]) throw new ExprError("arity", tok.pos, `${tok.v}/0`);
      return { type: "var", name: tok.v };
    }
    if (tok.t === "op" && tok.v === "(") {
      const e = expr();
      if (!isOp(")")) throw new ExprError("unclosed", tok.pos, "(");
      next();
      return e;
    }
    if (tok.t === "end") throw new ExprError(k === 1 ? "empty" : "unexpected", tok.pos, "end");
    throw new ExprError("unexpected", tok.pos, (tok as { v: string }).v);
  }

  const result = expr();
  if (peek().t !== "end") throw new ExprError("unexpected", peek().pos, peek().t === "num" ? String((peek() as { v: number }).v) : String((peek() as { v: string }).v));
  return result;
}

/** Free variable names in an expression, in order of first appearance (constants excluded). */
export function freeVariables(e: Expr, out: string[] = []): string[] {
  switch (e.type) {
    case "num": return out;
    case "var": if (!(e.name in CONSTANTS) && !out.includes(e.name)) out.push(e.name); return out;
    case "call": e.args.forEach((a) => freeVariables(a, out)); return out;
    case "bin": freeVariables(e.left, out); freeVariables(e.right, out); return out;
    case "neg": return freeVariables(e.arg, out);
  }
}

export type Scope = Record<string, number>;

export function evaluateAst(e: Expr, scope: Scope): number {
  switch (e.type) {
    case "num": return e.value;
    case "var": {
      if (e.name in scope) return scope[e.name];
      if (e.name in CONSTANTS) return CONSTANTS[e.name];
      throw new ExprError("unknown-name", 0, e.name);
    }
    case "call": return FUNCTIONS[e.name].fn(...e.args.map((a) => evaluateAst(a, scope)));
    case "neg": return -evaluateAst(e.arg, scope);
    case "bin": {
      const l = evaluateAst(e.left, scope);
      const r = evaluateAst(e.right, scope);
      switch (e.op) {
        case "+": return l + r;
        case "-": return l - r;
        case "*": return l * r;
        case "/": return l / r;
        case "^": return Math.pow(l, r);
      }
    }
  }
}

export interface Compiled {
  ast: Expr;
  variables: string[];
  evaluate: (scope?: Scope) => number;
}

/** Parse once, evaluate many times. Unknown variables surface at evaluation time. */
export function compile(src: string): Compiled {
  const ast = parse(src);
  const variables = freeVariables(ast);
  return { ast, variables, evaluate: (scope = {}) => evaluateAst(ast, scope) };
}

export function evaluate(src: string, scope: Scope = {}): number {
  return compile(src).evaluate(scope);
}

/** Lanczos approximation of Γ(x). */
function gamma(x: number): number {
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
  x -= 1;
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}
