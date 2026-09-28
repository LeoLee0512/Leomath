import type { Locale } from "@/i18n/config";

export type Bilingual = Record<Locale, string>;
export type ConceptStatus = "published" | "planned";
export type Level = "highschool" | "undergrad" | "advanced" | "structure";

export interface Concept {
  slug: string;
  title: Bilingual;
  summary: Bilingual;
  /** Taxonomic parent: where this sits in the tree of mathematics. */
  parent?: string;
  /** Learning prerequisites: what you should understand first. */
  prerequisites: string[];
  status: ConceptStatus;
  level: Level;
  /** Learning path this concept belongs to, if published. */
  path?: string;
  experiments: string[];
}

export interface LearningPath {
  slug: string;
  title: Bilingual;
  subtitle: Bilingual;
  /** What you will understand: shown as “If you want to understand … start here.” */
  intent: Bilingual;
  concepts: string[];
}

export type ExperimentKind = "linear-transform" | "ode-explorer" | "exponential-derivative" | "secant-tangent" | "riemann-sums" | "taylor-approx";

export interface Experiment {
  slug: string;
  kind: ExperimentKind;
  title: Bilingual;
  summary: Bilingual;
  concept: string;
}

const b = (zh: string, en: string): Bilingual => ({ zh, en });

export const concepts: Concept[] = [
  // ---- structure of mathematics (planned / taxonomy) ----
  { slug: "mathematics", title: b("数学", "Mathematics"), summary: b("一切从这里分叉。", "Everything branches from here."), prerequisites: [], status: "planned", level: "structure", experiments: [] },
  { slug: "analysis", title: b("分析", "Analysis"), summary: b("极限、连续、微分与积分。", "Limits, continuity, differentiation and integration."), parent: "mathematics", prerequisites: [], status: "planned", level: "structure", experiments: [] },
  { slug: "algebra", title: b("代数", "Algebra"), summary: b("结构、运算与对称。", "Structure, operations and symmetry."), parent: "mathematics", prerequisites: [], status: "planned", level: "structure", experiments: [] },
  { slug: "geometry", title: b("几何", "Geometry"), summary: b("形状、空间与变换。", "Shape, space and transformation."), parent: "mathematics", prerequisites: [], status: "planned", level: "structure", experiments: [] },
  { slug: "probability", title: b("概率", "Probability"), summary: b("不确定性的数学。", "The mathematics of uncertainty."), parent: "mathematics", prerequisites: [], status: "planned", level: "structure", experiments: [] },
  { slug: "conditional-probability", title: b("条件概率与 Bayes", "Bayes' theorem"), summary: b("用结果反推原因。", "Reasoning from effects back to causes."), parent: "probability", prerequisites: [], status: "planned", level: "undergrad", experiments: [] },
  { slug: "central-limit-theorem", title: b("中心极限定理", "Central limit theorem"), summary: b("分布为什么走向钟形。", "Why distributions tend to the bell curve."), parent: "probability", prerequisites: ["conditional-probability"], status: "planned", level: "undergrad", experiments: [] },

  // ---- foundations (planned) ----
  { slug: "functions", title: b("函数与实数", "Functions & reals"), summary: b("实数的完备性与函数的语言。", "Completeness of the reals and the language of functions."), parent: "analysis", prerequisites: [], status: "planned", level: "highschool", experiments: [] },
  { slug: "plane-geometry", title: b("平面几何与变换", "Plane geometry"), summary: b("对称、旋转、相似。", "Symmetry, rotation, similarity."), parent: "geometry", prerequisites: [], status: "planned", level: "highschool", experiments: [] },

  // ---- calculus path ----
  { slug: "limit", title: b("极限", "Limits"), summary: b("用 ε–δ 精确说出“无限接近”。", "Saying “arbitrarily close” precisely with ε–δ."), parent: "analysis", prerequisites: ["functions"], status: "published", level: "undergrad", path: "calculus", experiments: [] },
  { slug: "derivative", title: b("导数", "The derivative"), summary: b("变化率的极限，以及为什么 eˣ 的导数是自己。", "The limit of a rate of change, and why eˣ is its own derivative."), parent: "analysis", prerequisites: ["limit"], status: "published", level: "undergrad", path: "calculus", experiments: ["exponential-derivative", "secant-tangent"] },
  { slug: "mean-value-theorem", title: b("中值定理", "Mean value theorem"), summary: b("整体平均变化率一定在某一瞬间出现；Rolle → Lagrange，以及每个条件为什么不能省。", "The overall average rate of change is attained at some instant; Rolle → Lagrange, and why no hypothesis can be dropped."), parent: "analysis", prerequisites: ["derivative"], status: "published", level: "undergrad", path: "calculus", experiments: ["secant-tangent"] },
  { slug: "integral", title: b("积分", "The integral"), summary: b("Riemann 和的极限，与微积分基本定理。", "The limit of Riemann sums and the fundamental theorem."), parent: "analysis", prerequisites: ["limit", "derivative", "mean-value-theorem"], status: "published", level: "undergrad", path: "calculus", experiments: ["riemann-sums"] },
  { slug: "taylor-series", title: b("Taylor 展开", "Taylor expansion"), summary: b("用多项式逼近函数，并控制误差。", "Approximating functions by polynomials, with error control."), parent: "analysis", prerequisites: ["derivative", "mean-value-theorem", "integral"], status: "published", level: "undergrad", path: "calculus", experiments: ["taylor-approx"] },

  // ---- linear algebra path ----
  { slug: "vectors", title: b("向量", "Vectors"), summary: b("向量空间的公理，以及基与坐标。", "Axioms of a vector space; bases and coordinates."), parent: "algebra", prerequisites: ["plane-geometry"], status: "published", level: "undergrad", path: "linear-algebra", experiments: [] },
  { slug: "inner-product", title: b("内积与 Cauchy–Schwarz", "Inner products & Cauchy–Schwarz"), summary: b("长度与角度从哪里来；投影不会变长这一件事推出整个不等式。", "Where length and angle come from; the whole inequality follows from “a projection is never longer”."), parent: "algebra", prerequisites: ["vectors"], status: "published", level: "undergrad", path: "linear-algebra", experiments: [] },
  { slug: "linear-maps", title: b("线性映射", "Linear maps"), summary: b("保持加法与数乘的映射，由它对基的作用完全决定。", "Maps preserving addition and scaling, determined entirely by what they do to a basis."), parent: "algebra", prerequisites: ["vectors"], status: "published", level: "undergrad", path: "linear-algebra", experiments: ["linear-transform"] },
  { slug: "matrices", title: b("矩阵", "Matrices"), summary: b("线性映射的坐标表示；矩阵乘法为什么这样定义。", "Coordinate representation of linear maps; why matrix multiplication is defined the way it is."), parent: "algebra", prerequisites: ["linear-maps"], status: "published", level: "undergrad", path: "linear-algebra", experiments: ["linear-transform"] },
  { slug: "eigenvalues", title: b("特征值", "Eigenvalues"), summary: b("变换只是拉伸的方向。", "Directions along which a map is just a stretch."), parent: "algebra", prerequisites: ["matrices"], status: "published", level: "undergrad", path: "linear-algebra", experiments: ["linear-transform"] },

  // ---- differential equations path ----
  { slug: "what-is-ode", title: b("ODE 是什么", "What is an ODE"), summary: b("用导数描述变化规律；解的存在与唯一。", "Describing change through derivatives; existence and uniqueness of solutions."), parent: "analysis", prerequisites: ["derivative"], status: "published", level: "undergrad", path: "differential-equations", experiments: ["ode-explorer"] },
  { slug: "first-order-ode", title: b("一阶方程", "First-order equations"), summary: b("分离变量、积分因子，与解的几何。", "Separation of variables, integrating factors and the geometry of solutions."), parent: "analysis", prerequisites: ["what-is-ode", "integral"], status: "published", level: "undergrad", path: "differential-equations", experiments: ["ode-explorer"] },
  { slug: "second-order-linear-ode", title: b("二阶线性方程", "Second-order linear equations"), summary: b("特征方程为什么有效：它其实是特征值问题。", "Why the characteristic equation works: it is an eigenvalue problem."), parent: "analysis", prerequisites: ["first-order-ode", "eigenvalues"], status: "published", level: "undergrad", path: "differential-equations", experiments: ["ode-explorer"] },
  { slug: "numerical-ode", title: b("数值解", "Numerical solutions"), summary: b("Euler 与 RK4：步长、误差与 Taylor 展开的关系。", "Euler and RK4: step size, error and the connection to Taylor expansion."), parent: "analysis", prerequisites: ["first-order-ode", "taylor-series"], status: "published", level: "undergrad", path: "differential-equations", experiments: ["ode-explorer"] },

  // ---- beyond v0.1.1 (planned) ----
  { slug: "multivariable-calculus", title: b("多元微积分", "Multivariable calculus"), summary: b("偏导数、梯度与多重积分。", "Partial derivatives, gradients and multiple integrals."), parent: "analysis", prerequisites: ["derivative", "integral", "vectors"], status: "planned", level: "undergrad", experiments: [] },
  { slug: "pde", title: b("PDE", "PDE"), summary: b("热方程、波动方程与 Laplace 方程。", "Heat, wave and Laplace equations."), parent: "analysis", prerequisites: ["multivariable-calculus", "second-order-linear-ode"], status: "planned", level: "advanced", experiments: [] },
  { slug: "numerical-analysis", title: b("数值分析", "Numerical analysis"), summary: b("误差、稳定性与算法。", "Error, stability and algorithms."), parent: "analysis", prerequisites: ["numerical-ode", "matrices"], status: "planned", level: "advanced", experiments: [] },
  { slug: "group-theory", title: b("群论", "Group theory"), summary: b("对称的代数。", "The algebra of symmetry."), parent: "algebra", prerequisites: ["matrices", "plane-geometry"], status: "planned", level: "advanced", experiments: [] },
];

export const paths: LearningPath[] = [
  {
    slug: "calculus",
    title: b("微积分基础", "Foundations of calculus"),
    subtitle: b("极限 → 导数 → 中值定理 → 积分 → Taylor 展开", "Limits → Derivative → Mean value theorem → Integral → Taylor expansion"),
    intent: b("变化、极限、连续与累积", "change, limits, continuity and accumulation"),
    concepts: ["limit", "derivative", "mean-value-theorem", "integral", "taylor-series"],
  },
  {
    slug: "linear-algebra",
    title: b("线性代数基础", "Foundations of linear algebra"),
    subtitle: b("向量 → 内积 → 线性映射 → 矩阵 → 特征值", "Vectors → Inner products → Linear maps → Matrices → Eigenvalues"),
    intent: b("空间、变换与结构", "space, transformation and structure"),
    concepts: ["vectors", "inner-product", "linear-maps", "matrices", "eigenvalues"],
  },
  {
    slug: "differential-equations",
    title: b("微分方程入门", "Introduction to differential equations"),
    subtitle: b("ODE 是什么 → 一阶方程 → 二阶线性方程 → 数值解", "What is an ODE → First-order → Second-order linear → Numerical solutions"),
    intent: b("一个系统如何随时间演化", "how a system evolves in time"),
    concepts: ["what-is-ode", "first-order-ode", "second-order-linear-ode", "numerical-ode"],
  },
];

export const experiments: Experiment[] = [
  {
    slug: "linear-transform",
    kind: "linear-transform",
    title: b("线性变换", "Linear transformation"),
    summary: b("拖动基向量，观察矩阵如何拉伸、剪切、旋转、翻转整个平面；看行列式和特征向量随之变化。", "Drag the basis vectors and watch a matrix stretch, shear, rotate and flip the plane; see the determinant and eigenvectors change with it."),
    concept: "linear-maps",
  },
  {
    slug: "ode-explorer",
    kind: "ode-explorer",
    title: b("常微分方程数值解", "Numerical ODE explorer"),
    summary: b("改变初值、参数与步长，对比 Euler 与 RK4 在同一方程上的表现，并观察相图。", "Change initial values, parameters and step size; compare Euler and RK4 on the same equation and watch the phase portrait."),
    concept: "numerical-ode",
  },
  {
    slug: "exponential-derivative",
    kind: "exponential-derivative",
    title: b("为什么 eˣ 的导数是自己", "Why eˣ is its own derivative"),
    summary: b("拖动底数 a 与步长 h，观察差商曲线何时与 aˣ 重合。", "Drag the base a and the step h; watch when the difference-quotient curve coincides with aˣ."),
    concept: "derivative",
  },
  {
    slug: "secant-tangent",
    kind: "secant-tangent",
    title: b("割线变成切线", "Secant becomes tangent"),
    summary: b("缩短两点之间的距离 h，观察割线斜率如何趋近切线斜率：差商 → 导数。", "Shrink the distance h between two points and watch the secant slope approach the tangent slope: difference quotient → derivative."),
    concept: "derivative",
  },
  {
    slug: "riemann-sums",
    kind: "riemann-sums",
    title: b("Riemann 和", "Riemann sums"),
    summary: b("增加分割数，比较左端点、右端点与中点取样如何逼近同一块面积。", "Increase the number of subintervals and compare how left, right and midpoint sampling approach the same area."),
    concept: "integral",
  },
  {
    slug: "taylor-approx",
    kind: "taylor-approx",
    title: b("Taylor 逼近", "Taylor approximation"),
    summary: b("逐级提高多项式阶数，看它在展开点附近如何贴近原函数，误差如何向外增长，以及收敛半径在哪里。", "Raise the polynomial order step by step: see it hug the function near the centre, the error grow outward, and where the radius of convergence ends."),
    concept: "taylor-series",
  },
];

// ---------- lookups ----------
const conceptMap = new Map(concepts.map((c) => [c.slug, c]));
const pathMap = new Map(paths.map((p) => [p.slug, p]));
const experimentMap = new Map(experiments.map((e) => [e.slug, e]));

export function getConcept(slug: string): Concept | undefined {
  return conceptMap.get(slug);
}
export function getPath(slug: string): LearningPath | undefined {
  return pathMap.get(slug);
}
export function getExperiment(slug: string): Experiment | undefined {
  return experimentMap.get(slug);
}
export function publishedConcepts(): Concept[] {
  return concepts.filter((c) => c.status === "published");
}

/** All transitive prerequisites of a concept, nearest first (BFS order). */
export function prerequisiteClosure(slug: string): string[] {
  const seen = new Set<string>();
  const queue = [...(conceptMap.get(slug)?.prerequisites ?? [])];
  const order: string[] = [];
  while (queue.length) {
    const next = queue.shift()!;
    if (seen.has(next)) continue;
    seen.add(next);
    order.push(next);
    queue.push(...(conceptMap.get(next)?.prerequisites ?? []));
  }
  return order;
}

/** Concepts that list `slug` as a direct prerequisite. */
export function dependents(slug: string): Concept[] {
  return concepts.filter((c) => c.prerequisites.includes(slug));
}

export function experimentsForConcept(slug: string): Experiment[] {
  const c = conceptMap.get(slug);
  if (!c) return [];
  return c.experiments.map((e) => experimentMap.get(e)).filter((e): e is Experiment => Boolean(e));
}

export function neighboursInPath(slug: string): { prev?: Concept; next?: Concept; path?: LearningPath } {
  const c = conceptMap.get(slug);
  if (!c?.path) return {};
  const p = pathMap.get(c.path);
  if (!p) return {};
  const i = p.concepts.indexOf(slug);
  return {
    path: p,
    prev: i > 0 ? conceptMap.get(p.concepts[i - 1]) : undefined,
    next: i < p.concepts.length - 1 ? conceptMap.get(p.concepts[i + 1]) : undefined,
  };
}

/**
 * The prerequisite chain leading to `slug`, in a learning order (topological),
 * ending with `slug` itself. Used to display “极限 → 导数 → … → PDE”.
 */
export function prerequisiteChain(slug: string): string[] {
  const closure = new Set(prerequisiteClosure(slug));
  closure.add(slug);
  const indeg = new Map<string, number>();
  for (const s of closure) {
    indeg.set(s, (conceptMap.get(s)?.prerequisites ?? []).filter((p) => closure.has(p)).length);
  }
  const ready = [...closure].filter((s) => indeg.get(s) === 0).sort();
  const order: string[] = [];
  while (ready.length) {
    const s = ready.shift()!;
    order.push(s);
    for (const t of closure) {
      if ((conceptMap.get(t)?.prerequisites ?? []).includes(s)) {
        const d = (indeg.get(t) ?? 0) - 1;
        indeg.set(t, d);
        if (d === 0) ready.push(t);
      }
    }
  }
  return order;
}
