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

export type ExperimentKind = "linear-transform" | "ode-explorer" | "exponential-derivative" | "secant-tangent" | "riemann-sums" | "taylor-approx" | "birthday-problem" | "conditioning" | "bayes-screening";

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
  { slug: "conditional-probability", title: b("条件概率与 Bayes", "Bayes' theorem"), summary: b("知道一件事发生了，就把样本空间缩小到它；再用结果反推原因。", "Knowing an event occurred shrinks the sample space to it; then reason from effects back to causes."), parent: "probability", prerequisites: ["probability-space"], status: "published", level: "undergrad", path: "probability", experiments: ["bayes-screening", "conditioning"], tools: ["plot"], credits: [{ url: `${PROB_DEMOS}/ybs`, note: b("筛查实验的思路参考", "Screening experiment idea from") }, { url: `${PROB_DEMOS}/Venn`, note: b("事件关系实验的思路参考", "Event-relations experiment idea from") }] },
  { slug: "random-variables", title: b("随机变量与分布", "Random variables"), summary: b("把结果变成数；二项分布的极限是 Poisson。", "Turning outcomes into numbers; the Poisson law as a limit of binomials."), parent: "probability", prerequisites: ["conditional-probability"], status: "planned", level: "undergrad", experiments: [] },
  { slug: "expectation-variance", title: b("期望与方差", "Mean & variance"), summary: b("协方差是一种内积，所以相关系数落在 [−1, 1]。", "Covariance is an inner product, so correlation lies in [−1, 1]."), parent: "probability", prerequisites: ["random-variables", "inner-product"], status: "planned", level: "undergrad", experiments: [] },
  { slug: "central-limit-theorem", title: b("中心极限定理", "Central limit theorem"), summary: b("分布为什么走向钟形。", "Why distributions tend to the bell curve."), parent: "probability", prerequisites: ["expectation-variance"], status: "planned", level: "undergrad", experiments: [] },

  // ---- foundations (planned) ----
  { slug: "functions", title: b("函数与实数", "Functions & reals"), summary: b("实数的完备性与函数的语言。", "Completeness of the reals and the language of functions."), parent: "analysis", prerequisites: [], status: "planned", level: "highschool", experiments: [] },
  { slug: "plane-geometry", title: b("平面几何与变换", "Plane geometry"), summary: b("对称、旋转、相似。", "Symmetry, rotation, similarity."), parent: "geometry", prerequisites: [], status: "planned", level: "highschool", experiments: [] },

  // ---- calculus path ----
  { slug: "limit", title: b("极限", "Limits"), summary: b("用 ε–δ 精确说出“无限接近”。", "Saying “arbitrarily close” precisely with ε–δ."), parent: "analysis", prerequisites: ["functions"], status: "published", level: "undergrad", path: "calculus", experiments: [], tools: ["plot"] },
  { slug: "derivative", title: b("导数", "The derivative"), summary: b("变化率的极限，以及为什么 eˣ 的导数是自己。", "The limit of a rate of change, and why eˣ is its own derivative."), parent: "analysis", prerequisites: ["limit"], status: "published", level: "undergrad", path: "calculus", experiments: ["exponential-derivative", "secant-tangent"], tools: ["plot"] },
  { slug: "mean-value-theorem", title: b("中值定理", "Mean value theorem"), summary: b("整体平均变化率一定在某一瞬间出现；Rolle → Lagrange，以及每个条件为什么不能省。", "The overall average rate of change is attained at some instant; Rolle → Lagrange, and why no hypothesis can be dropped."), parent: "analysis", prerequisites: ["derivative"], status: "published", level: "undergrad", path: "calculus", experiments: ["secant-tangent"], tools: ["plot"] },
  { slug: "integral", title: b("积分", "The integral"), summary: b("Riemann 和的极限，与微积分基本定理。", "The limit of Riemann sums and the fundamental theorem."), parent: "analysis", prerequisites: ["limit", "derivative", "mean-value-theorem"], status: "published", level: "undergrad", path: "calculus", experiments: ["riemann-sums"], tools: ["plot"] },
  { slug: "taylor-series", title: b("Taylor 展开", "Taylor expansion"), summary: b("用多项式逼近函数，并控制误差。", "Approximating functions by polynomials, with error control."), parent: "analysis", prerequisites: ["derivative", "mean-value-theorem", "integral"], status: "published", level: "undergrad", path: "calculus", experiments: ["taylor-approx"], tools: ["plot"] },

  // ---- linear algebra path ----
  { slug: "vectors", title: b("向量", "Vectors"), summary: b("向量空间的公理，以及基与坐标。", "Axioms of a vector space; bases and coordinates."), parent: "algebra", prerequisites: ["plane-geometry"], status: "published", level: "undergrad", path: "linear-algebra", experiments: [], tools: ["matrix"] },
  { slug: "inner-product", title: b("内积与 Cauchy–Schwarz", "Inner products & Cauchy–Schwarz"), summary: b("长度与角度从哪里来；投影不会变长这一件事推出整个不等式。", "Where length and angle come from; the whole inequality follows from “a projection is never longer”."), parent: "algebra", prerequisites: ["vectors"], status: "published", level: "undergrad", path: "linear-algebra", experiments: [], tools: ["matrix"] },
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
    audience: b("想弄懂“概率到底在算什么”的人。这条路线正在建设，已完成前两节。", "anyone who wants to know what probability actually computes. The path is being built; the first two sections are done."),
    outcome: b("理解概率空间与三条公理；会用补事件和计数算概率；掌握条件概率、独立性与 Bayes 公式。", "understand probability spaces and the three axioms; compute probabilities by counting and complements; use conditional probability, independence and Bayes' theorem."),
    concepts: ["probability-space", "conditional-probability"],
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
        "精确曲线在 $n\\approx20$ 到 $40$ 之间最陡，$n=23$ 时第一次超过 $\\tfrac12$。关键在**对数**而不在人数：$23$ 人有 $\\binom{23}{2}=253$ 对，每一对都可能撞上；而“和第一个人同一天”只涉及 $22$ 对，概率 $1-(364/365)^{22}\\approx0.059$。频率是随机的，模拟越多越接近公式，偏差大约按 $1/\\sqrt N$ 缩小：这是后面大数定律要说清楚的事。",
        "The exact curve is steepest between $n\\approx20$ and $40$ and first exceeds $\\tfrac12$ at $n=23$. What matters is the number of **pairs**, not people: $23$ people make $\\binom{23}{2}=253$ pairs, each a chance of a match; “sharing the first person's day” involves only $22$ pairs, probability $1-(364/365)^{22}\\approx0.059$. A frequency is random; the more classes simulated, the closer it gets, the gap shrinking roughly like $1/\\sqrt N$. Making that precise is the job of the law of large numbers later on."
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
        "默认参数下约 $10$ 个病人几乎全被查出，可 $990$ 个健康人里有约 $79$ 个误报，阳性者约 $89$ 人，真正患病的只占约 $11\\%$。灵敏度回答的是 $P(+\\mid\\text{病})$，我们关心的是 $P(\\text{病}\\mid+)$，两者之间隔着**先验**：病人太少，误报的绝对人数就压过了真阳性。患病率升高时，同样的检测给出的后验大幅上升，所以同一张化验单在不同人群里含义不同。复检时，第一次阳性的人群患病率已经是 $11\\%$ 而不是 $1\\%$：上一次的后验成了这一次的先验，后验跳到约 $59\\%$。",
        "With the defaults, the roughly $10$ ill people are almost all caught, but about $79$ of the $990$ healthy people test positive too: of about $89$ positives only about $11\\%$ are ill. Sensitivity is $P(+\\mid\\text{ill})$; what we want is $P(\\text{ill}\\mid+)$, and between them stands the **prior**: the ill are so rare that false alarms outnumber true ones. Raise the prevalence and the same test gives a much higher posterior, so the same lab report means different things in different populations. On retesting, the prevalence among first-time positives is already $11\\%$, not $1\\%$: yesterday's posterior is today's prior, and the posterior jumps to about $59\\%$."
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
