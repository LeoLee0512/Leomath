import type { Locale } from "@/i18n/config";

export type Bilingual = Record<Locale, string>;
export type ConceptStatus = "published" | "planned";
export type Level = "highschool" | "undergrad" | "advanced" | "structure";

/**
 * Where an idea came from, when LeoMath rewrites something first seen elsewhere.
 * Shown as a link only: `url` is the public source, `note` says what was borrowed.
 */
export interface Credit {
  url: string;
  note: Bilingual;
}

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
  /** Tools on /tools that let the reader compute with this concept. */
  tools?: Tool["id"][];
  credits?: Credit[];
}

export interface LearningPath {
  slug: string;
  title: Bilingual;
  subtitle: Bilingual;
  /** What you will understand: shown as “If you want to understand … start here.” */
  intent: Bilingual;
  /** "intro": needs only school mathematics; "intermediate": builds on another path. */
  level: "intro" | "intermediate";
  /** What you should already know, in one line. */
  requires: Bilingual;
  /** Who the path is written for. */
  audience: Bilingual;
  /** What you can do after finishing it: only what the published concepts actually teach. */
  outcome: Bilingual;
  concepts: string[];
  credits?: Credit[];
}

const b = (zh: string, en: string): Bilingual => ({ zh, en });

/** Public probability demos whose ideas the probability path rewrites. Credited by link only, by the author's wish. */
const PROB_DEMOS = "https://github.com/huzhuofan1020-svg";

export interface Tool {
  id: "formula" | "plot" | "matrix";
  title: Bilingual;
  /** Call-to-action shown on concept pages. */
  cta: Bilingual;
  href: string;
}

export const tools: Tool[] = [
  { id: "plot", title: b("函数绘图与计算", "Plotter & calculator"), cta: b("用函数绘图器试一试 →", "Try it in the plotter →"), href: "/tools#plot" },
  { id: "matrix", title: b("矩阵计算器", "Matrix calculator"), cta: b("用矩阵计算器试一试 →", "Try it in the matrix calculator →"), href: "/tools#matrix" },
  { id: "formula", title: b("公式编辑器", "Formula editor"), cta: b("在公式编辑器里写一写 →", "Write it in the formula editor →"), href: "/tools#formula" },
];

export function getTool(id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}

/** Questions to answer after playing with an experiment, and the explanation revealed afterwards. */
export interface Observation {
  questions: Bilingual[];
  explanation: Bilingual;
}

export type ExperimentKind = "linear-transform" | "ode-explorer" | "exponential-derivative" | "secant-tangent" | "riemann-sums" | "taylor-approx" | "birthday-problem" | "conditioning" | "bayes-screening" | "binomial-poisson" | "epsilon-band" | "basis-coordinates" | "projection-slack";

export interface Experiment {
  slug: string;
  kind: ExperimentKind;
  title: Bilingual;
  summary: Bilingual;
  concept: string;
  observe?: Observation;
  credits?: Credit[];
}


export const concepts: Concept[] = [
  // ---- structure of mathematics (planned / taxonomy) ----
  { slug: "mathematics", title: b("数学", "Mathematics"), summary: b("一切从这里分叉。", "Everything branches from here."), prerequisites: [], status: "planned", level: "structure", experiments: [] },
  { slug: "analysis", title: b("分析", "Analysis"), summary: b("极限、连续、微分与积分。", "Limits, continuity, differentiation and integration."), parent: "mathematics", prerequisites: [], status: "planned", level: "structure", experiments: [] },
  { slug: "algebra", title: b("代数", "Algebra"), summary: b("结构、运算与对称。", "Structure, operations and symmetry."), parent: "mathematics", prerequisites: [], status: "planned", level: "structure", experiments: [] },
  { slug: "geometry", title: b("几何", "Geometry"), summary: b("形状、空间与变换。", "Shape, space and transformation."), parent: "mathematics", prerequisites: [], status: "planned", level: "structure", experiments: [] },
  { slug: "probability", title: b("概率", "Probability"), summary: b("不确定性的数学。", "The mathematics of uncertainty."), parent: "mathematics", prerequisites: [], status: "planned", level: "structure", experiments: [] },

  // ---- probability path ----
  { slug: "probability-space", title: b("概率空间", "Probability spaces"), summary: b("样本空间、事件与三条公理；生日问题为什么反直觉。", "Sample space, events and three axioms; why the birthday problem defies intuition."), parent: "probability", prerequisites: [], status: "published", level: "undergrad", path: "probability", experiments: ["birthday-problem"], tools: ["plot"], credits: [{ url: `${PROB_DEMOS}/GDGX`, note: b("生日问题实验的思路参考", "Birthday-problem experiment idea from") }], },
  { slug: "conditional-probability", title: b("条件概率与 Bayes", "Conditioning & Bayes"), summary: b("知道一件事发生了，就把样本空间缩小到它；再用结果反推原因。", "Knowing an event occurred shrinks the sample space to it; then reason from effects back to causes."), parent: "probability", prerequisites: ["probability-space"], status: "published", level: "undergrad", path: "probability", experiments: ["bayes-screening", "conditioning"], tools: ["plot"], credits: [{ url: `${PROB_DEMOS}/ybs`, note: b("筛查实验的思路参考", "Screening experiment idea from") }, { url: `${PROB_DEMOS}/Venn`, note: b("事件关系实验的思路参考", "Event-relations experiment idea from") }] },
  { slug: "random-variables", title: b("随机变量与分布", "Random variables"), summary: b("把结果变成数；二项分布的极限是 Poisson。", "Turning outcomes into numbers; the Poisson law as a limit of binomials."), parent: "probability", prerequisites: ["conditional-probability"], status: "published", level: "undergrad", path: "probability", experiments: ["binomial-poisson"], tools: ["plot"], credits: [{ url: `${PROB_DEMOS}/EXFB`, note: b("二项分布峰值分析的思路参考", "Binomial peak analysis idea from") }, { url: `${PROB_DEMOS}/PoissonDist`, note: b("Poisson 计数模拟的思路参考", "Poisson counting simulation idea from") }] },
  { slug: "expectation-variance", title: b("期望与方差", "Mean & variance"), summary: b("协方差是一种内积，所以相关系数落在 [−1, 1]。", "Covariance is an inner product, so correlation lies in [−1, 1]."), parent: "probability", prerequisites: ["random-variables", "inner-product"], status: "planned", level: "undergrad", experiments: [] },
  { slug: "central-limit-theorem", title: b("中心极限定理", "Central limit theorem"), summary: b("分布为什么走向钟形。", "Why distributions tend to the bell curve."), parent: "probability", prerequisites: ["expectation-variance"], status: "planned", level: "undergrad", experiments: [] },

  // ---- foundations (planned) ----
  { slug: "functions", title: b("函数与实数", "Functions & reals"), summary: b("实数的完备性与函数的语言。", "Completeness of the reals and the language of functions."), parent: "analysis", prerequisites: [], status: "planned", level: "highschool", experiments: [] },
  { slug: "plane-geometry", title: b("平面几何与变换", "Plane geometry"), summary: b("对称、旋转、相似。", "Symmetry, rotation, similarity."), parent: "geometry", prerequisites: [], status: "planned", level: "highschool", experiments: [] },

  // ---- calculus path ----
  { slug: "limit", title: b("极限", "Limits"), summary: b("用 ε–δ 精确说出“无限接近”。", "Saying “arbitrarily close” precisely with ε–δ."), parent: "analysis", prerequisites: ["functions"], status: "published", level: "undergrad", path: "calculus", experiments: ["epsilon-band"], tools: ["plot"] },
  { slug: "derivative", title: b("导数", "The derivative"), summary: b("变化率的极限，以及为什么 eˣ 的导数是自己。", "The limit of a rate of change, and why eˣ is its own derivative."), parent: "analysis", prerequisites: ["limit"], status: "published", level: "undergrad", path: "calculus", experiments: ["exponential-derivative", "secant-tangent"], tools: ["plot"] },
  { slug: "mean-value-theorem", title: b("中值定理", "Mean value theorem"), summary: b("整体平均变化率一定在某一瞬间出现；Rolle → Lagrange，以及每个条件为什么不能省。", "The overall average rate of change is attained at some instant; Rolle → Lagrange, and why no hypothesis can be dropped."), parent: "analysis", prerequisites: ["derivative"], status: "published", level: "undergrad", path: "calculus", experiments: ["secant-tangent"], tools: ["plot"] },
  { slug: "integral", title: b("积分", "The integral"), summary: b("Riemann 和的极限，与微积分基本定理。", "The limit of Riemann sums and the fundamental theorem."), parent: "analysis", prerequisites: ["limit", "derivative", "mean-value-theorem"], status: "published", level: "undergrad", path: "calculus", experiments: ["riemann-sums"], tools: ["plot"] },
  { slug: "taylor-series", title: b("Taylor 展开", "Taylor expansion"), summary: b("用多项式逼近函数，并控制误差。", "Approximating functions by polynomials, with error control."), parent: "analysis", prerequisites: ["derivative", "mean-value-theorem", "integral"], status: "published", level: "undergrad", path: "calculus", experiments: ["taylor-approx"], tools: ["plot"] },

  // ---- linear algebra path ----
  { slug: "vectors", title: b("向量", "Vectors"), summary: b("向量空间的公理，以及基与坐标。", "Axioms of a vector space; bases and coordinates."), parent: "algebra", prerequisites: ["plane-geometry"], status: "published", level: "undergrad", path: "linear-algebra", experiments: ["basis-coordinates"], tools: ["matrix"] },
  { slug: "inner-product", title: b("内积与 Cauchy–Schwarz", "Inner products & Cauchy–Schwarz"), summary: b("长度与角度从哪里来；投影不会变长这一件事推出整个不等式。", "Where length and angle come from; the whole inequality follows from “a projection is never longer”."), parent: "algebra", prerequisites: ["vectors"], status: "published", level: "undergrad", path: "linear-algebra", experiments: ["projection-slack"], tools: ["matrix"] },
  { slug: "linear-maps", title: b("线性映射", "Linear maps"), summary: b("保持加法与数乘的映射，由它对基的作用完全决定。", "Maps preserving addition and scaling, determined entirely by what they do to a basis."), parent: "algebra", prerequisites: ["vectors"], status: "published", level: "undergrad", path: "linear-algebra", experiments: ["linear-transform"], tools: ["matrix"] },
  { slug: "matrices", title: b("矩阵", "Matrices"), summary: b("线性映射的坐标表示；矩阵乘法为什么这样定义。", "Coordinate representation of linear maps; why matrix multiplication is defined the way it is."), parent: "algebra", prerequisites: ["linear-maps"], status: "published", level: "undergrad", path: "linear-algebra", experiments: ["linear-transform"], tools: ["matrix"] },
  { slug: "eigenvalues", title: b("特征值", "Eigenvalues"), summary: b("变换只是拉伸的方向。", "Directions along which a map is just a stretch."), parent: "algebra", prerequisites: ["matrices"], status: "published", level: "undergrad", path: "linear-algebra", experiments: ["linear-transform"], tools: ["matrix"] },

  // ---- differential equations path ----
  { slug: "what-is-ode", title: b("ODE 是什么", "What is an ODE"), summary: b("用导数描述变化规律；解的存在与唯一。", "Describing change through derivatives; existence and uniqueness of solutions."), parent: "analysis", prerequisites: ["derivative"], status: "published", level: "undergrad", path: "differential-equations", experiments: ["ode-explorer"], tools: ["plot"] },
  { slug: "first-order-ode", title: b("一阶方程", "First-order equations"), summary: b("分离变量、积分因子，与解的几何。", "Separation of variables, integrating factors and the geometry of solutions."), parent: "analysis", prerequisites: ["what-is-ode", "integral"], status: "published", level: "undergrad", path: "differential-equations", experiments: ["ode-explorer"], tools: ["plot"] },
  { slug: "second-order-linear-ode", title: b("二阶线性方程", "Second-order linear equations"), summary: b("特征方程为什么有效：它其实是特征值问题。", "Why the characteristic equation works: it is an eigenvalue problem."), parent: "analysis", prerequisites: ["first-order-ode", "eigenvalues"], status: "published", level: "undergrad", path: "differential-equations", experiments: ["ode-explorer"], tools: ["matrix"] },
  { slug: "numerical-ode", title: b("数值解", "Numerical solutions"), summary: b("Euler 与 RK4：步长、误差与 Taylor 展开的关系。", "Euler and RK4: step size, error and the connection to Taylor expansion."), parent: "analysis", prerequisites: ["first-order-ode", "taylor-series"], status: "published", level: "undergrad", path: "differential-equations", experiments: ["ode-explorer"], tools: ["plot"] },

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
    level: "intro",
    requires: b("高中的函数与代数", "school functions and algebra"),
    audience: b("学过高中数学、想把微积分真正弄懂的人", "anyone with school maths who wants to really understand calculus"),
    outcome: b("用 ε–δ 说清极限；推导导数、中值定理和微积分基本定理；用 Taylor 展开估计误差。", "state limits precisely with ε–δ; derive the derivative, the mean value theorem and the fundamental theorem; bound errors with Taylor expansions."),
    concepts: ["limit", "derivative", "mean-value-theorem", "integral", "taylor-series"],
  },
  {
    slug: "linear-algebra",
    title: b("线性代数基础", "Foundations of linear algebra"),
    subtitle: b("向量 → 内积 → 线性映射 → 矩阵 → 特征值", "Vectors → Inner products → Linear maps → Matrices → Eigenvalues"),
    intent: b("空间、变换与结构", "space, transformation and structure"),
    level: "intro",
    requires: b("高中的平面向量", "school vectors in the plane"),
    audience: b("第一次学线性代数，或者学过但只会算、不知道为什么的人", "first-time learners, or anyone who can compute but not say why"),
    outcome: b("把矩阵看成空间的变换；理解基与坐标、内积与 Cauchy–Schwarz、矩阵乘法的定义，以及特征值的几何意义。", "see matrices as transformations of space; understand bases and coordinates, inner products and Cauchy–Schwarz, why matrix multiplication is defined as it is, and what eigenvalues mean geometrically."),
    concepts: ["vectors", "inner-product", "linear-maps", "matrices", "eigenvalues"],
  },
  {
    slug: "differential-equations",
    title: b("微分方程入门", "Introduction to differential equations"),
    subtitle: b("ODE 是什么 → 一阶方程 → 二阶线性方程 → 数值解", "What is an ODE → First-order → Second-order linear → Numerical solutions"),
    intent: b("一个系统如何随时间演化", "how a system evolves in time"),
    level: "intermediate",
    requires: b("「微积分基础」，以及「线性代数基础」里的特征值", "Foundations of calculus, and eigenvalues from Foundations of linear algebra"),
    audience: b("学完微积分、想知道方程怎样描述变化的人", "anyone who has finished calculus and wants to see equations describe change"),
    outcome: b("理解解的存在与唯一；会解一阶方程和二阶线性方程；知道 Euler 法和 RK4 的误差从哪里来。", "understand existence and uniqueness; solve first-order and second-order linear equations; know where the errors of Euler's method and RK4 come from."),
    concepts: ["what-is-ode", "first-order-ode", "second-order-linear-ode", "numerical-ode"],
  },
  {
    slug: "probability",
    title: b("概率论基础", "Foundations of probability"),
    subtitle: b("概率空间 → 条件概率 → 随机变量 → 期望与方差 → 中心极限定理（建设中）", "Probability spaces → Conditional probability → Random variables → Mean & variance → Central limit theorem (in progress)"),
    intent: b("不确定性、计数与规律", "uncertainty, counting and regularity"),
    level: "intro",
    requires: b("高中的排列组合", "school counting (permutations and combinations)"),
    audience: b("想弄懂“概率到底在算什么”的人。这条路线正在建设，已完成前三节。", "anyone who wants to know what probability actually computes. The path is being built; the first three sections are done."),
    outcome: b("理解概率空间与三条公理；会用补事件和计数算概率；掌握条件概率、独立性与 Bayes 公式；用随机变量和分布描述计数，知道二项分布何时可以用 Poisson 分布近似。", "understand probability spaces and the three axioms; compute probabilities by counting and complements; use conditional probability, independence and Bayes' theorem; describe counts with random variables and distributions, and know when a binomial law can be replaced by a Poisson law."),
    concepts: ["probability-space", "conditional-probability", "random-variables"],
    credits: [{ url: `${PROB_DEMOS}/probability-stats-hub`, note: b("路线规划参考", "Path outline informed by") }],
  },
];

export const experiments: Experiment[] = [
  {
    slug: "linear-transform",
    kind: "linear-transform",
    title: b("线性变换", "Linear transformation"),
    summary: b("拖动基向量，观察矩阵如何拉伸、剪切、旋转、翻转整个平面；看行列式和特征向量随之变化。", "Drag the basis vectors and watch a matrix stretch, shear, rotate and flip the plane; see the determinant and eigenvectors change with it."),
    concept: "linear-maps",
    observe: {
      questions: [
        b("把 e₁ 和 e₂ 拖到同一条直线上，网格变成了什么？行列式是多少？", "Drag e₁ and e₂ onto the same line. What happens to the grid, and what is the determinant?"),
        b("只拖 e₁，原点和 e₂ 所在的整条竖线动了吗？为什么？", "Drag only e₁. Do the origin and the whole vertical line through e₂ move? Why?"),
        b("按“旋转”，特征值显示为复数。平面上有没有哪条直线在旋转后仍是自己？", "Press “Rotate”: the eigenvalues become complex. Is there any line in the plane that maps to itself under a rotation?"),
      ],
      explanation: b(
        "共线时整个平面被压到一条直线上，行列式为 $0$：面积被压成零，信息丢失，变换不可逆。只拖 $e_1$ 时，$e_2$ 那条竖线上的点都是 $y\\,e_2$ 的形式，不含 $e_1$，所以纹丝不动，而原点永远不动：这就是线性。旋转没有实特征方向，因为任何直线都被转走了；判别式 $(\\operatorname{tr}A)^2-4\\det A<0$ 正说明这一点。",
        "When the two vectors are collinear the whole plane collapses onto a line and the determinant is $0$: area is squashed to nothing, information is lost, the map is not invertible. Dragging only $e_1$ leaves the vertical line through $e_2$ fixed, since its points are $y\\,e_2$ with no $e_1$ component, and the origin never moves: that is linearity. A rotation has no real eigen-direction because every line is turned away; the discriminant $(\\operatorname{tr}A)^2-4\\det A<0$ says exactly that."
      ),
    },
  },
  {
    slug: "ode-explorer",
    kind: "ode-explorer",
    title: b("常微分方程数值解", "Numerical ODE explorer"),
    summary: b("改变初值、参数与步长，对比 Euler 与 RK4 在同一方程上的表现，并观察相图。", "Change initial values, parameters and step size; compare Euler and RK4 on the same equation and watch the phase portrait."),
    concept: "numerical-ode",
    observe: {
      questions: [
        b("对“指数增长”，把步长 h 减半，Euler 与 RK4 的终点误差各变成原来的多少？", "For “Exponential growth”, halve the step h. By what factor does each method's end-point error shrink?"),
        b("把 h 调到最大，Euler 的曲线还像指数函数吗？它错在哪一步？", "Push h to its maximum. Does Euler's curve still look exponential? Which step goes wrong?"),
        b("在“阻尼振子”里增大 γ，相图从椭圆变成什么？γ 超过 ω 之后呢？", "In “Damped oscillator”, increase γ. What does the phase portrait turn into? And once γ exceeds ω?"),
      ],
      explanation: b(
        "Euler 误差约减半（一阶），RK4 约减到 $1/16$（四阶）：全局误差分别是 $O(h)$ 与 $O(h^4)$。步长很大时 Euler 每一步都沿当前斜率直走，错过了曲线在这一步内的弯曲，误差逐步累积；步长超过 $2/|\\lambda|$ 时甚至会振荡发散。阻尼让椭圆变成向内的螺旋（欠阻尼），$\\gamma>\\omega$ 后不再绕圈，直接奔向原点（过阻尼）：这三种行为由特征方程判别式的符号决定。",
        "Euler's error roughly halves (first order) while RK4's drops to about $1/16$ (fourth order): global errors $O(h)$ and $O(h^4)$. With a large step Euler walks straight along the current slope and misses the curvature within each step; the errors accumulate, and beyond $h=2/|\\lambda|$ it even oscillates and diverges. Damping turns the ellipse into an inward spiral (underdamped); once $\\gamma>\\omega$ it stops circling and heads straight to the origin (overdamped). The sign of the characteristic discriminant decides between the three."
      ),
    },
  },
  {
    slug: "exponential-derivative",
    kind: "exponential-derivative",
    title: b("为什么 eˣ 的导数是自己", "Why eˣ is its own derivative"),
    summary: b("拖动底数 a 与步长 h，观察差商曲线何时与 aˣ 重合。", "Drag the base a and the step h; watch when the difference-quotient curve coincides with aˣ."),
    concept: "derivative",
    observe: {
      questions: [
        b("固定 h，把 a 从 1.5 拖到 4：差商曲线相对原函数是变高还是变低？", "Fix h and drag a from 1.5 to 4. Does the difference-quotient curve rise or fall relative to the function?"),
        b("在 a = 2 处把 h 调小，右下角的比值趋向哪个数？它和 ln 2 ≈ 0.693 有关吗？", "At a = 2 make h small. What number does the ratio in the corner approach? Is it related to ln 2 ≈ 0.693?"),
        b("为什么无论 a 是多少，差商曲线的形状都和 aˣ 一样，只是高矮不同？", "Why does the difference-quotient curve always have the shape of aˣ, only taller or shorter, whatever a is?"),
      ],
      explanation: b(
        "比值 $\\frac{a^h-1}{h}$ 随 $a$ 增大而增大，所以差商曲线相对原函数越来越高；$a=e$ 时恰好重合。固定 $a$ 让 $h\\to0$，比值趋于 $\\ln a$，在 $a=2$ 处就是 $0.693$。形状相同是因为 $a^{x+h}-a^x=a^x(a^h-1)$：差商永远是 $a^x$ 乘一个只依赖 $a,h$ 的常数。这条因式分解就是 $(a^x)'=a^x\\ln a$ 的全部内容。",
        "The ratio $\\frac{a^h-1}{h}$ grows with $a$, so the difference-quotient curve rises relative to the function; at $a=e$ they coincide. Fixing $a$ and letting $h\\to0$, the ratio tends to $\\ln a$, which at $a=2$ is $0.693$. The shape is the same because $a^{x+h}-a^x=a^x(a^h-1)$: the quotient is always $a^x$ times a constant depending only on $a$ and $h$. That factorisation is the whole content of $(a^x)'=a^x\\ln a$."
      ),
    },
  },
  {
    slug: "secant-tangent",
    kind: "secant-tangent",
    title: b("割线变成切线", "Secant becomes tangent"),
    summary: b("缩短两点之间的距离 h，观察割线斜率如何趋近切线斜率：差商 → 导数。", "Shrink the distance h between two points and watch the secant slope approach the tangent slope: difference quotient → derivative."),
    concept: "derivative",
    observe: {
      questions: [
        b("把 h 从 2 缩到 0.01，割线斜率与切线斜率的差怎样变化？是均匀减小吗？", "Shrink h from 2 to 0.01. How does the gap between secant and tangent slopes change? Does it shrink uniformly?"),
        b("选 x²，把 x₀ 放在 0：割线斜率随 h 怎么变？能猜出 f′(0) 吗？", "Choose x² and put x₀ at 0. How does the secant slope depend on h? Can you guess f′(0)?"),
        b("选 ln x，把 x₀ 拖到很靠近 0 的地方，切线斜率发生了什么？", "Choose ln x and drag x₀ very close to 0. What happens to the tangent slope?"),
      ],
      explanation: b(
        "差 $\\frac{f(x_0+h)-f(x_0)}{h}-f'(x_0)$ 对光滑函数大约与 $h$ 成正比（Taylor 展开的下一项是 $\\tfrac12f''(x_0)h$），所以 $h$ 减半、差也大约减半。对 $x^2$ 在 $0$ 处，割线斜率恰好等于 $h$，趋于 $0=f'(0)$。$\\ln x$ 的导数是 $1/x$，靠近 $0$ 时切线越来越陡，趋于无穷：极限过程可以有界，也可以没有。",
        "For a smooth function the gap $\\frac{f(x_0+h)-f(x_0)}{h}-f'(x_0)$ is roughly proportional to $h$ (the next Taylor term is $\\tfrac12f''(x_0)h$), so halving $h$ about halves the gap. For $x^2$ at $0$ the secant slope is exactly $h$, tending to $0=f'(0)$. The derivative of $\\ln x$ is $1/x$: near $0$ the tangent gets ever steeper and the slope tends to infinity. Limit processes may be bounded or not."
      ),
    },
  },
  {
    slug: "riemann-sums",
    kind: "riemann-sums",
    title: b("Riemann 和", "Riemann sums"),
    summary: b("增加分割数，比较左端点、右端点与中点取样如何逼近同一块面积。", "Increase the number of subintervals and compare how left, right and midpoint sampling approach the same area."),
    concept: "integral",
    observe: {
      questions: [
        b("对 x² 在 [0,2] 上，n = 8 时左端点和右端点的和一个偏小一个偏大，为什么？", "For x² on [0,2] with n = 8, the left-endpoint sum is too small and the right-endpoint sum too large. Why?"),
        b("把 n 从 8 加到 200，三种取点的误差分别以多快的速度减小？中点为什么好得多？", "Raise n from 8 to 200. How fast does each rule's error shrink? Why is the midpoint rule so much better?"),
        b("把 b 拖到 a 的左边，Riemann 和的符号变了。这说明积分定义里的 Δx 是什么？", "Drag b to the left of a: the Riemann sum changes sign. What does that say about Δx in the definition?"),
      ],
      explanation: b(
        "$x^2$ 递增，左端点取的是每段最小值、右端点取最大值，所以一个是下和、一个是上和，真值夹在中间。左右端点误差约为 $O(1/n)$，中点误差约为 $O(1/n^2)$：中点矩形在每小段上多出和少掉的两块近似抵消。$\\Delta x=x_i-x_{i-1}$ 带符号，$b<a$ 时为负，因此 $\\int_b^a=-\\int_a^b$ 不是约定，而是定义的直接结果。",
        "$x^2$ is increasing, so the left endpoint takes each piece's minimum and the right endpoint its maximum: one is a lower sum, the other an upper sum, and the true value lies between. Endpoint errors are about $O(1/n)$, the midpoint error about $O(1/n^2)$: on each piece the midpoint rectangle's overshoot and undershoot nearly cancel. $\\Delta x=x_i-x_{i-1}$ carries a sign and is negative when $b<a$, so $\\int_b^a=-\\int_a^b$ is a consequence of the definition, not a convention."
      ),
    },
  },
  {
    slug: "taylor-approx",
    kind: "taylor-approx",
    title: b("Taylor 逼近", "Taylor approximation"),
    summary: b("逐级提高多项式阶数，看它在展开点附近如何贴近原函数，误差如何向外增长，以及收敛半径在哪里。", "Raise the polynomial order step by step: see it hug the function near the centre, the error grow outward, and where the radius of convergence ends."),
    concept: "taylor-series",
    observe: {
      questions: [
        b("当 n 增大时，展开点附近发生了什么？", "As n increases, what happens near the centre a?"),
        b("当 a 改变时，逼近最好的区域怎样移动？", "As a changes, how does the region of best approximation move?"),
        b("为什么提高阶数不一定让任意远处都逼近得更好？试试 1/(1−x) 在 x = 1.5 处。", "Why does raising the order not necessarily improve the approximation far away? Try 1/(1−x) at x = 1.5."),
      ],
      explanation: b(
        "$P_n$ 在 $a$ 处与 $f$ 的前 $n$ 阶导数完全相同，所以阶数越高，$a$ 附近吻合的范围越宽，误差按 $|x-a|^{n+1}$ 增长。逼近最好的区域始终以 $a$ 为中心，拖动 $a$ 它就整体平移：Taylor 多项式首先是**局部**逼近。对 $\\frac1{1-x}$，级数是 $\\sum x^k$，只在 $|x|<1$ 收敛；$x=1.5$ 处每提高一阶，$P_n$ 离真值反而更远。有限阶导数吻合并不保证任意远处收敛，收敛半径是级数自己的性质。",
        "$P_n$ shares the first $n$ derivatives of $f$ at $a$, so a higher order widens the region of agreement around $a$, with the error growing like $|x-a|^{n+1}$. The region of best fit is always centred at $a$ and slides with it: a Taylor polynomial is first of all a **local** approximation. For $\\frac1{1-x}$ the series is $\\sum x^k$, convergent only for $|x|<1$; at $x=1.5$ each extra order takes $P_n$ further from the truth. Matching finitely many derivatives never guarantees convergence far away; the radius of convergence is a property of the series itself."
      ),
    },
  },
  {
    slug: "birthday-problem",
    kind: "birthday-problem",
    title: b("生日问题", "The birthday problem"),
    summary: b("改变人数，逐个班级地模拟生日，看频率如何走向公式给出的概率；对比精确值与指数下界。", "Change the group size, simulate class after class, and watch the frequency approach the formula; compare the exact value with the exponential bound."),
    concept: "probability-space",
    observe: {
      questions: [
        b("人数从 10 拖到 60，曲线在哪一段涨得最快？至少多少人时概率超过一半？", "Drag the group size from 10 to 60. Where does the curve rise fastest? From how many people on is the probability above one half?"),
        b("n = 23 时，“两人同一天”的概率约 50%，可“有人和第一个人同一天”只有约 6%。两者差在哪里？", "At n = 23 “some two share a day” is about 50%, yet “someone shares the first person's day” is only about 6%. What is the difference?"),
        b("只模拟 10 个班，频率和理论值差多少？模拟 1000 个班之后呢？", "Simulate only 10 classes: how far is the frequency from the theory? And after 1000 classes?"),
      ],
      explanation: b(
        "精确曲线在 $n\\approx20$ 附近涨得最快（大约 $12$ 到 $30$ 之间都很陡），$n=23$ 时第一次超过 $\\tfrac12$。关键在**对数**而不在人数：$23$ 人有 $\\binom{23}{2}=253$ 对，每一对都可能撞上；而“和第一个人同一天”只涉及 $22$ 对，概率 $1-(364/365)^{22}\\approx0.059$。频率是随机的，模拟越多越接近公式，偏差大约按 $1/\\sqrt N$ 缩小：这是后面大数定律要说清楚的事。",
        "The exact curve rises fastest around $n\\approx20$ (it is steep from roughly $12$ to $30$) and first exceeds $\\tfrac12$ at $n=23$. What matters is the number of **pairs**, not people: $23$ people make $\\binom{23}{2}=253$ pairs, each a chance of a match; “sharing the first person's day” involves only $22$ pairs, probability $1-(364/365)^{22}\\approx0.059$. A frequency is random; the more classes simulated, the closer it gets, the gap shrinking roughly like $1/\\sqrt N$. Making that precise is the job of the law of large numbers later on."
      ),
    },
    credits: [{ url: `${PROB_DEMOS}/GDGX`, note: b("实验思路参考", "Experiment idea from") }],
  },
  {
    slug: "bayes-screening",
    kind: "bayes-screening",
    title: b("筛查中的 Bayes", "Bayes in screening"),
    summary: b("一千个人，按患病与否、检测阴阳分成四块。改变患病率、灵敏度和误报率，看阳性的人里真正患病的占多少；再对阳性者复检一次。", "A thousand people, split by illness and test result. Change the prevalence, sensitivity and false-positive rate and see what share of positives are really ill; then retest the positives."),
    concept: "conditional-probability",
    observe: {
      questions: [
        b("默认参数下，阳性的人里真正患病的有几个？为什么灵敏度高达 95%，这个比例却这么低？", "With the default settings, how many of the positives are actually ill? Why is that share so low when the sensitivity is 95%?"),
        b("把患病率从 1% 拖到 20%，后验概率怎样变？检测本身并没有变。", "Drag the prevalence from 1% to 20%. How does the posterior change? The test itself has not changed."),
        b("打开“复检阳性者”：为什么同一个检测做第二次，结论就可靠得多？", "Turn on “Retest the positives”. Why does the same test, taken a second time, give a much more reliable answer?"),
      ],
      explanation: b(
        "默认参数下约 $10$ 个病人几乎全被查出，可 $990$ 个健康人里有约 $79$ 个误报，阳性者约 $89$ 人，真正患病的只占约 $11\\%$。灵敏度回答的是 $P(+\\mid\\text{病})$，我们关心的是 $P(\\text{病}\\mid+)$，两者之间隔着**先验**：病人太少，误报的绝对人数就压过了真阳性。患病率升高时，同样的检测给出的后验大幅上升，所以同一张化验单在不同人群里含义不同。复检时，第一次阳性的人群患病率已经是 $11\\%$ 而不是 $1\\%$：上一次的后验成了这一次的先验，后验跳到约 $59\\%$。这一步假设两次检测在“是否患病”已知时相互独立；如果误报来自某种会重复出现的体质原因，复检的作用会小得多。",
        "With the defaults, the roughly $10$ ill people are almost all caught, but about $79$ of the $990$ healthy people test positive too: of about $89$ positives only about $11\\%$ are ill. Sensitivity is $P(+\\mid\\text{ill})$; what we want is $P(\\text{ill}\\mid+)$, and between them stands the **prior**: the ill are so rare that false alarms outnumber true ones. Raise the prevalence and the same test gives a much higher posterior, so the same lab report means different things in different populations. On retesting, the prevalence among first-time positives is already $11\\%$, not $1\\%$: yesterday's posterior is today's prior, and the posterior jumps to about $59\\%$. This assumes the two tests err independently given the true state; if false alarms come from some persistent trait of the person, retesting helps much less."
      ),
    },
    credits: [{ url: `${PROB_DEMOS}/ybs`, note: b("实验思路参考", "Experiment idea from") }],
  },
  {
    slug: "conditioning",
    kind: "conditioning",
    title: b("条件概率是面积之比", "Conditioning as a ratio of areas"),
    summary: b("把样本空间画成面积为 1 的正方形，A 占左边一列。调 P(A)、P(B)、P(A∩B)，看 B 在 A 内外的高度；再“以 B 为条件”，只看 B 里面。", "Draw the sample space as a unit square with A as its left column. Adjust P(A), P(B), P(A∩B) and watch the height of B inside and outside A; then condition on B and look only inside it."),
    concept: "conditional-probability",
    observe: {
      questions: [
        b("按“独立”：B 变成了什么形状？这时 P(B | A) 和 P(B) 是什么关系？", "Press “Independent”. What shape does B take? How do P(B | A) and P(B) compare?"),
        b("按“互斥”：A 和 B 看起来“毫不相干”，它们独立吗？", "Press “Mutually exclusive”. A and B look “unrelated”. Are they independent?"),
        b("打开“以 B 为条件”，P(A | B) 是哪两块面积之比？它和 P(B | A) 一般相等吗？", "Turn on “Condition on B”. Which two areas does P(A | B) compare? Is it usually equal to P(B | A)?"),
      ],
      explanation: b(
        "独立时 B 在 A 内外一样高，拼成一条水平带：知道 $A$ 是否发生，完全不改变 $B$ 所占的比例，即 $P(B\\mid A)=P(B)$。互斥时 B 在 A 里面高度为零：一旦 $A$ 发生，$B$ 就**不可能**发生，这是最强的相关，而不是无关；只要 $P(A),P(B)>0$，互斥的事件一定不独立。以 $B$ 为条件就是把 $B$ 当成新的全空间，$P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}$ 是交集占 $B$ 的比例；$P(B\\mid A)$ 是交集占 $A$ 的比例，分母不同，一般不相等。",
        "When independent, B has the same height inside and outside A and forms a horizontal band: knowing whether $A$ occurred does not change $B$'s share at all, $P(B\\mid A)=P(B)$. When mutually exclusive, B has zero height inside A: once $A$ occurs, $B$ **cannot** occur. That is the strongest kind of dependence, not unrelatedness; as long as $P(A),P(B)>0$, exclusive events are never independent. Conditioning on $B$ makes $B$ the new whole space: $P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}$ is the intersection's share of $B$, while $P(B\\mid A)$ is its share of $A$. Different denominators, so in general they differ."
      ),
    },
    credits: [{ url: `${PROB_DEMOS}/Venn`, note: b("实验思路参考", "Experiment idea from") }],
  },
  {
    slug: "epsilon-band",
    kind: "epsilon-band",
    title: b("ε–N：把数列关进带子", "ε–N: trapping a sequence in a band"),
    summary: b("在候选极限 L 上下各画出宽 ε 的带子，找出最后一个跑出带子的项。缩小 ε，看 N 怎样变大；换一个错误的 L，或一个没有极限的数列，看 N 为什么找不到。", "Draw a band of half-width ε around a candidate limit L and find the last term outside it. Shrink ε and watch N grow; move L to a wrong value, or pick a sequence with no limit, and see why no N exists."),
    concept: "limit",
    observe: {
      questions: [
        b("对 n/(n+1)，把 ε 从 0.1 缩到 0.05，再缩到 0.02，N 分别是多少？能写出 N 与 ε 的关系吗？", "For n/(n+1), shrink ε from 0.1 to 0.05 and then 0.02. What is N each time? Can you write N in terms of ε?"),
        b("选 1 + sin n/√n，慢慢缩小 ε。N 是平稳增长的吗？定义要求我们找到“最小的” N 吗？", "Pick 1 + sin n/√n and shrink ε slowly. Does N grow smoothly? Does the definition ask for the smallest N?"),
        b("选 (−1)ⁿ，把 L 拖到任何位置。能找到 N 吗？再选 n/(n+1)，把 L 拖到 0.95、ε 取 0.02 呢？", "Pick (−1)ⁿ and drag L anywhere. Is there an N? Now pick n/(n+1), set L to 0.95 and ε to 0.02."),
      ],
      explanation: b(
        "对 $\\frac n{n+1}$，$|a_n-1|=\\frac1{n+1}$，它不小于 $\\varepsilon$ 当且仅当 $n\\le\\frac1\\varepsilon-1$，所以最后一个带外的项是 $N=\\lfloor1/\\varepsilon\\rfloor-1$：$\\varepsilon=0.1,0.05,0.02$ 时 $N=9,19,49$。$\\varepsilon$ 缩小一半，$N$ 约增大一倍。$1+\\frac{\\sin n}{\\sqrt n}$ 的 $N$ 会一跳一跳地变：$\\varepsilon$ 从 $0.102$ 缩到 $0.100$，$N$ 从 $83$ 跳到 $99$，因为 $\\sin n$ 不规则地回到 $\\pm1$ 附近。定义只要求**存在**一个够用的 $N$，不要求最小，也不要求公式好看：由 $\\bigl|\\frac{\\sin n}{\\sqrt n}\\bigr|\\le\\frac1{\\sqrt n}$，取 $N=\\lceil1/\\varepsilon^2\\rceil$ 永远够用，这正是证明里的做法。$(-1)^n$ 的项在 $1$ 与 $-1$ 之间来回跳，两者相距 $2$；若它们都无限多次落在 $(L-\\varepsilon,L+\\varepsilon)$ 里，就有 $2<2\\varepsilon$。所以 $\\varepsilon\\le1$ 时，无论 $L$ 放在哪里都找不到 $N$：没有极限。$L=0.95$ 同样失败：$\\varepsilon<0.05$ 时，后面所有的项都在带子上方。",
        "For $\\frac n{n+1}$, $|a_n-1|=\\frac1{n+1}$, which is at least $\\varepsilon$ exactly when $n\\le\\frac1\\varepsilon-1$, so the last term outside is $N=\\lfloor1/\\varepsilon\\rfloor-1$: $N=9,19,49$ for $\\varepsilon=0.1,0.05,0.02$. Halve $\\varepsilon$ and $N$ roughly doubles. For $1+\\frac{\\sin n}{\\sqrt n}$, $N$ moves in jumps: from $\\varepsilon=0.102$ to $0.100$ it leaps from $83$ to $99$, because $\\sin n$ returns near $\\pm1$ irregularly. The definition only asks that **some** sufficient $N$ exist, not the smallest one and not a tidy formula: since $\\bigl|\\frac{\\sin n}{\\sqrt n}\\bigr|\\le\\frac1{\\sqrt n}$, $N=\\lceil1/\\varepsilon^2\\rceil$ always works, and that is how a proof would go. The terms of $(-1)^n$ jump between $1$ and $-1$, which are $2$ apart; if both kept landing in $(L-\\varepsilon,L+\\varepsilon)$ we would have $2<2\\varepsilon$. So for $\\varepsilon\\le1$ no $N$ exists wherever $L$ is: there is no limit. $L=0.95$ fails too: once $\\varepsilon<0.05$, all later terms sit above the band."
      ),
    },
  },
  {
    slug: "basis-coordinates",
    kind: "basis-coordinates",
    title: b("基与坐标", "Bases and coordinates"),
    summary: b("拖动两个基向量和一个向量 v，看 b₁、b₂ 张成的斜网格，以及 v 在这组基下的坐标 (c₁, c₂)。换一组基，v 不动，坐标却变了；基向量共线时，坐标要么不存在，要么不唯一。", "Drag two basis vectors and a vector v; see the skewed grid spanned by b₁, b₂ and the coordinates (c₁, c₂) of v in that basis. Change the basis: v stays put, its coordinates change. When the basis vectors are collinear, coordinates either do not exist or are not unique."),
    concept: "vectors",
    observe: {
      questions: [
        b("按“斜基”：v 没有动，它的坐标从 (1, 2) 变成了多少？“向量”和“坐标”哪一个依赖于基？", "Press “Skewed basis”. v has not moved; its coordinates were (1, 2). What are they now? Which depends on the basis, the vector or its coordinates?"),
        b("按“几乎共线”，再用方向键把 v 移动一小步。坐标变化得比 v 的移动大还是小？为什么？", "Press “Nearly collinear” and move v one small step with the arrow keys. Do the coordinates change more or less than v moved? Why?"),
        b("按“共线”：还能把 v 写成 c₁b₁ + c₂b₂ 吗？把 v 拖到那条直线上，又会怎样？", "Press “Collinear”. Can v still be written as c₁b₁ + c₂b₂? What happens if you drag v onto that line?"),
      ],
      explanation: b(
        "$v=(1,2)$ 在斜基 $b_1=(2,1),\\ b_2=(-1,1)$ 下的坐标是 $(1,1)$：$1\\cdot(2,1)+1\\cdot(-1,1)=(1,2)$。向量是平面上同一个箭头，坐标是相对于一组基读出来的数，换基就换数。基向量几乎共线时，$b_1,b_2$ 张成的平行四边形面积只有 $0.5$，解坐标要除以这个面积：$v=(1,2)$ 的坐标是 $(-5.5,\\,6)$，$v$ 向右移动 $0.1$，坐标就变成 $(-5.25,\\,5.8)$，变化是移动量的两倍多。面积越接近 $0$，坐标就越大、越敏感。共线时面积为 $0$，$b_1,b_2$ 只张成一条直线：$v$ 不在线上，**写不出来**（张成失败）；$v$ 在线上，**写法有无穷多种**（线性无关失败）。基的定义里的两个条件，恰好分别对应坐标的存在与唯一。",
        "In the skewed basis $b_1=(2,1),\\ b_2=(-1,1)$, $v=(1,2)$ has coordinates $(1,1)$: $1\\cdot(2,1)+1\\cdot(-1,1)=(1,2)$. The vector is the same arrow in the plane; coordinates are numbers read off relative to a basis, and a new basis gives new numbers. When the basis vectors are nearly collinear, the parallelogram they span has area only $0.5$, and solving for coordinates divides by that area: $v=(1,2)$ has coordinates $(-5.5,\\,6)$, and moving $v$ right by $0.1$ changes them to $(-5.25,\\,5.8)$, more than twice the move. The closer the area to $0$, the larger and more sensitive the coordinates. When collinear the area is $0$ and $b_1,b_2$ span only a line: if $v$ is off it, it **cannot be written** at all (spanning fails); if $v$ is on it, there are **infinitely many ways** (independence fails). The two conditions in the definition of a basis correspond exactly to existence and uniqueness of coordinates."
      ),
    },
  },
  {
    slug: "projection-slack",
    kind: "projection-slack",
    title: b("投影与 Cauchy–Schwarz 的差额", "Projection and the Cauchy–Schwarz slack"),
    summary: b("拖动 u 和 v，看 u 在 v 方向上的投影和剩下的部分；两根条比较 |⟨u,v⟩| 与 ‖u‖‖v‖。再换一个加权内积：垂直、单位圆和投影都变了，不等式照样成立。", "Drag u and v and see the projection of u onto v and what is left over; two bars compare |⟨u,v⟩| with ‖u‖‖v‖. Then switch to a weighted inner product: perpendicularity, the unit circle and the projection all change, and the inequality still holds."),
    concept: "inner-product",
    observe: {
      questions: [
        b("拖着 u 绕原点转一圈。|⟨u,v⟩| 那根条什么时候和 ‖u‖‖v‖ 一样长？这时 u 与 v 是什么关系？", "Drag u once around the origin. When is the |⟨u,v⟩| bar as long as ‖u‖‖v‖? How are u and v related then?"),
        b("把 u 从 v 所在的直线上往外拉。“差额”和红色虚线 u − tv 的长度有什么关系？", "Pull u away from the line through v. How is the “slack” related to the length of the dashed red remainder u − tv?"),
        b("切换到加权内积 2u₁v₁ + u₂v₂，按“加权下正交”。u 和 v 看上去并不垂直，内积却是 0。单位圆变成了什么？不等式还成立吗？", "Switch to the weighted inner product 2u₁v₁ + u₂v₂ and press “Orthogonal when weighted”. u and v do not look perpendicular, yet their inner product is 0. What has the unit circle become? Does the inequality still hold?"),
      ],
      explanation: b(
        "只有 $u$ 落在 $v$ 所在的直线上（同向或反向）时两根条才一样长，即 $u,v$ 线性相关：这就是等号条件。差额 $\\|u\\|^2\\|v\\|^2-\\langle u,v\\rangle^2$ 恰好等于 $\\|v\\|^2\\,\\|u-tv\\|^2$：把证明里的 $0\\le\\langle u-tv,u-tv\\rangle$ 两边乘以 $\\langle v,v\\rangle$，得到的就是这个式子。默认位置 $u=(1,2.5),\\ v=(3,1)$ 时，$\\langle u,v\\rangle=5.5$，$\\|u\\|^2\\|v\\|^2=72.5$，差额 $42.25=10\\times\\|(-0.65,1.95)\\|^2$。所以“投影不会变长”和 Cauchy–Schwarz 是同一件事，差额就是剩下那一段的长度（的平方，再乘 $\\|v\\|^2$）。加权内积下，“长度为 $1$”的点是椭圆 $2x^2+y^2=1$；$u=(1,2)$ 与 $v=(2,-2)$ 的加权内积是 $2\\cdot2-4=0$，所以它们正交，投影是 $0$。直角、圆、投影都由内积决定，而证明只用到了三条公理，所以不等式在这里一样成立。",
        "The bars are equal only when $u$ lies on the line through $v$ (same or opposite direction), that is, when $u,v$ are dependent: the equality case. The slack $\\|u\\|^2\\|v\\|^2-\\langle u,v\\rangle^2$ equals $\\|v\\|^2\\,\\|u-tv\\|^2$ exactly: multiply the proof's $0\\le\\langle u-tv,u-tv\\rangle$ by $\\langle v,v\\rangle$ and this is what you get. At the start, $u=(1,2.5),\\ v=(3,1)$: $\\langle u,v\\rangle=5.5$, $\\|u\\|^2\\|v\\|^2=72.5$, slack $42.25=10\\times\\|(-0.65,1.95)\\|^2$. So “a projection is never longer” and Cauchy–Schwarz are the same statement, and the slack is the length of what is left over (squared, times $\\|v\\|^2$). With the weighted inner product the points of length $1$ form the ellipse $2x^2+y^2=1$; $u=(1,2)$ and $v=(2,-2)$ have weighted inner product $2\\cdot2-4=0$, so they are orthogonal and the projection is $0$. Right angles, circles and projections are all decided by the inner product, and the proof used only the three axioms, so the inequality holds here just the same."
      ),
    },
  },
  {
    slug: "binomial-poisson",
    kind: "binomial-poisson",
    title: b("二项分布走向 Poisson", "From binomial to Poisson"),
    summary: b("做 n 次独立试验，每次成功的概率是 λ/n。柱子是成功次数的分布，圆点是 Poisson 分布；保持平均次数 λ 不变、增大 n，看两者重合，并看距离缩小得多快。", "Run n independent trials, each succeeding with probability λ/n. The bars are the distribution of the number of successes, the dots the Poisson law; keep the average λ fixed, raise n, and watch the two merge and how fast the distance shrinks."),
    concept: "random-variables",
    observe: {
      questions: [
        b("保持 λ = 3，把 n 从 10 调到 100，再调到 1000。柱子和圆点怎样靠拢？距离 d 每次变成原来的多少？", "Keep λ = 3 and set n to 10, then 100, then 1000. How do the bars and dots come together? By what factor does the distance d shrink each time?"),
        b("把 n 固定在 20，比较 λ = 1 与 λ = 10。n 一样大，为什么一个近似得很好、一个差得很远？", "Fix n = 20 and compare λ = 1 with λ = 10. The n is the same; why is one approximation good and the other poor?"),
        b("按“峰值并列”（n = 9，λ = 4.5）：最高的柱子有几根？一般地，最可能的值在哪里？", "Press “tied peak” (n = 9, λ = 4.5). How many bars are tallest? In general, where is the most likely value?"),
      ],
      explanation: b(
        "$\\lambda=3$ 时，$n=10,100,1000$ 对应的距离约为 $0.086,\\ 0.0076,\\ 0.00075$：$n$ 每大十倍，距离约缩小为十分之一，即 $d$ 与 $1/n$ 同阶；在双对数图上它是一条斜率为 $-1$ 的直线，与虚线表示的上界 $\\lambda^2/n$ 平行。$n=20$ 时，$\\lambda=1$ 对应 $p=0.05$，距离约 $0.014$；$\\lambda=10$ 对应 $p=0.5$，距离约 $0.17$。二项分布的方差是 $np(1-p)$，Poisson 分布的方差是 $\\lambda=np$，只有 $p$ 很小时两者才接近，所以要的是“$p$ 小”，不只是“$n$ 大”。$n=9,\\ p=\\tfrac12$ 时 $k=4$ 与 $k=5$ 两根柱子一样高：相邻两项之比 $\\dfrac{P(X=k)}{P(X=k-1)}=\\dfrac{(n-k+1)p}{k(1-p)}$ 大于 $1$ 当且仅当 $k<(n+1)p$，所以峰值在 $\\lfloor(n+1)p\\rfloor$，$(n+1)p$ 恰为整数时它和左边一项并列。Poisson 分布同理，$\\pi_k/\\pi_{k-1}=\\lambda/k$，峰值在 $\\lfloor\\lambda\\rfloor$；$\\lambda=3$ 时 $k=2$ 与 $k=3$ 的两个圆点一样高。",
        "For $\\lambda=3$ the distances at $n=10,100,1000$ are about $0.086,\\ 0.0076,\\ 0.00075$: each tenfold increase of $n$ divides the distance by about ten, so $d$ is of order $1/n$. On the log–log plot it is a line of slope $-1$, parallel to the dashed bound $\\lambda^2/n$. At $n=20$, $\\lambda=1$ means $p=0.05$ and a distance of about $0.014$; $\\lambda=10$ means $p=0.5$ and about $0.17$. The binomial variance is $np(1-p)$ and the Poisson variance is $\\lambda=np$; they agree only when $p$ is small. What matters is “$p$ small”, not merely “$n$ large”. With $n=9,\\ p=\\tfrac12$ the bars at $k=4$ and $k=5$ are equally tall: the ratio $\\dfrac{P(X=k)}{P(X=k-1)}=\\dfrac{(n-k+1)p}{k(1-p)}$ exceeds $1$ exactly when $k<(n+1)p$, so the peak is at $\\lfloor(n+1)p\\rfloor$, tied with its left neighbour when $(n+1)p$ is a whole number. The Poisson law works the same way: $\\pi_k/\\pi_{k-1}=\\lambda/k$ puts the peak at $\\lfloor\\lambda\\rfloor$, and at $\\lambda=3$ the dots at $k=2$ and $k=3$ are equally tall."
      ),
    },
    credits: [{ url: `${PROB_DEMOS}/EXFB`, note: b("峰值分析的思路参考", "Peak analysis idea from") }, { url: `${PROB_DEMOS}/PoissonDist`, note: b("计数模拟的思路参考", "Counting simulation idea from") }],
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

/** Where to go next in a path: the first concept not yet marked done (the first one for a new visitor). */
export function nextInPath(p: LearningPath, progress: Record<string, string>): { concept: Concept; index: number; done: number } {
  const done = p.concepts.filter((c) => progress[c] === "done").length;
  const index = Math.max(0, p.concepts.findIndex((c) => progress[c] !== "done"));
  return { concept: conceptMap.get(p.concepts[index])!, index, done };
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
