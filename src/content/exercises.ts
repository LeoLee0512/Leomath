import type { Bilingual } from "./graph";
import { numericMistakes, optionFeedback } from "./exercise-feedback";

export type Exercise =
  | {
      id: string;
      concept: string;
      kind: "numeric";
      statement: Bilingual;
      answer: number;
      tolerance: number;
      hint: Bilingual;
      solution: Bilingual;
    }
  | {
      id: string;
      concept: string;
      kind: "choice";
      statement: Bilingual;
      options: Bilingual[];
      correct: number;
      hint: Bilingual;
      solution: Bilingual;
    };

const b = (zh: string, en: string): Bilingual => ({ zh, en });

export const exercises: Exercise[] = [
  // ---- limit ----
  {
    id: "limit-1", concept: "limit", kind: "numeric",
    statement: b("求 $\\displaystyle\\lim_{x\\to 0}\\frac{\\sin 3x}{x}$。", "Compute $\\displaystyle\\lim_{x\\to 0}\\frac{\\sin 3x}{x}$."),
    answer: 3, tolerance: 1e-6,
    hint: b("令 $u=3x$，利用 $\\lim_{u\\to0}\\frac{\\sin u}{u}=1$。", "Put $u=3x$ and use $\\lim_{u\\to0}\\frac{\\sin u}{u}=1$."),
    solution: b("$\\frac{\\sin 3x}{x}=3\\cdot\\frac{\\sin 3x}{3x}\\to 3\\cdot 1=3$。", "$\\frac{\\sin 3x}{x}=3\\cdot\\frac{\\sin 3x}{3x}\\to 3\\cdot 1=3$."),
  },
  {
    id: "limit-2", concept: "limit", kind: "choice",
    statement: b("设 $f(x)=2x+1$。要保证当 $0<|x-1|<\\delta$ 时 $|f(x)-3|<\\varepsilon$，下列哪个 $\\delta$ 一定可行？", "Let $f(x)=2x+1$. Which $\\delta$ guarantees $|f(x)-3|<\\varepsilon$ whenever $0<|x-1|<\\delta$?"),
    options: [b("$\\delta=\\varepsilon$", "$\\delta=\\varepsilon$"), b("$\\delta=\\varepsilon/2$", "$\\delta=\\varepsilon/2$"), b("$\\delta=2\\varepsilon$", "$\\delta=2\\varepsilon$"), b("$\\delta=\\varepsilon^2$", "$\\delta=\\varepsilon^2$")],
    correct: 1,
    hint: b("先算出 $|f(x)-3|$ 与 $|x-1|$ 的关系。", "First relate $|f(x)-3|$ to $|x-1|$."),
    solution: b("$|f(x)-3|=|2x-2|=2|x-1|$，所以只要 $|x-1|<\\varepsilon/2$ 就有 $|f(x)-3|<\\varepsilon$。", "$|f(x)-3|=|2x-2|=2|x-1|$, so $|x-1|<\\varepsilon/2$ suffices."),
  },
  // ---- derivative ----
  {
    id: "derivative-1", concept: "derivative", kind: "numeric",
    statement: b("设 $f(x)=x^3-2x$，求 $f'(2)$。", "Let $f(x)=x^3-2x$. Find $f'(2)$."),
    answer: 10, tolerance: 1e-6,
    hint: b("先用定义或幂法则求 $f'(x)$。", "Find $f'(x)$ first, from the definition or the power rule."),
    solution: b("$f'(x)=3x^2-2$，$f'(2)=12-2=10$。", "$f'(x)=3x^2-2$, so $f'(2)=12-2=10$."),
  },
  {
    id: "derivative-2", concept: "derivative", kind: "numeric",
    statement: b("求 $\\displaystyle\\lim_{h\\to0}\\frac{2^h-1}{h}$（保留三位小数）。这正是 $2^x$ 在 $x=0$ 处的导数。", "Compute $\\displaystyle\\lim_{h\\to0}\\frac{2^h-1}{h}$ to three decimals. This is the derivative of $2^x$ at $x=0$."),
    answer: Math.LN2, tolerance: 6e-4,
    hint: b("写 $2^h=e^{h\\ln 2}$，再用 $e^u\\approx 1+u$。", "Write $2^h=e^{h\\ln 2}$ and use $e^u\\approx 1+u$."),
    solution: b("$\\frac{2^h-1}{h}=\\frac{e^{h\\ln2}-1}{h}\\to\\ln 2\\approx0.693$。", "$\\frac{2^h-1}{h}=\\frac{e^{h\\ln2}-1}{h}\\to\\ln 2\\approx0.693$."),
  },
  // ---- mean value theorem ----
  {
    id: "mean-value-theorem-1", concept: "mean-value-theorem", kind: "numeric",
    statement: b("$f(x)=x^3$ 在 $[0,2]$ 上，求满足 $f'(\\xi)=\\dfrac{f(2)-f(0)}{2-0}$ 的 $\\xi\\in(0,2)$（保留三位小数）。", "For $f(x)=x^3$ on $[0,2]$, find $\\xi\\in(0,2)$ with $f'(\\xi)=\\dfrac{f(2)-f(0)}{2-0}$ (three decimals)."),
    answer: 2 / Math.sqrt(3), tolerance: 6e-4,
    hint: b("平均斜率是 $4$，所以要解 $3\\xi^2=4$。", "The average slope is $4$, so solve $3\\xi^2=4$."),
    solution: b("$3\\xi^2=4\\Rightarrow\\xi=2/\\sqrt3\\approx1.155$，它确实在 $(0,2)$ 内。", "$3\\xi^2=4\\Rightarrow\\xi=2/\\sqrt3\\approx1.155$, which lies in $(0,2)$."),
  },
  {
    id: "mean-value-theorem-2", concept: "mean-value-theorem", kind: "choice",
    statement: b("$f(x)=|x|$ 在 $[-1,1]$ 上，割线斜率为 $0$，但没有任何点的导数为 $0$。中值定理的哪个条件不满足？", "For $f(x)=|x|$ on $[-1,1]$ the secant slope is $0$, yet no point has derivative $0$. Which hypothesis of the mean value theorem fails?"),
    options: [b("在 $[-1,1]$ 上连续", "Continuity on $[-1,1]$"), b("在 $(-1,1)$ 内可导", "Differentiability on $(-1,1)$"), b("端点值相等", "Equal values at the endpoints"), b("区间有界", "Boundedness of the interval")],
    correct: 1,
    hint: b("$|x|$ 在哪一点没有导数？", "Where does $|x|$ fail to have a derivative?"),
    solution: b("$|x|$ 处处连续，但在 $0$ 处不可导；开区间内可导这一条件被破坏，结论随之失效。", "$|x|$ is continuous everywhere but not differentiable at $0$; the differentiability hypothesis fails and so does the conclusion."),
  },
  // ---- integral ----
  {
    id: "integral-1", concept: "integral", kind: "numeric",
    statement: b("计算 $\\displaystyle\\int_0^1 x^2\\,dx$（保留四位小数）。", "Compute $\\displaystyle\\int_0^1 x^2\\,dx$ to four decimals."),
    answer: 1 / 3, tolerance: 6e-5,
    hint: b("找一个导数是 $x^2$ 的函数。", "Find a function whose derivative is $x^2$."),
    solution: b("$\\int_0^1x^2\\,dx=\\left[\\tfrac{x^3}{3}\\right]_0^1=\\tfrac13$。", "$\\int_0^1x^2\\,dx=\\left[\\tfrac{x^3}{3}\\right]_0^1=\\tfrac13$."),
  },
  {
    id: "integral-2", concept: "integral", kind: "choice",
    statement: b("设 $F(x)=\\displaystyle\\int_0^x e^{-t^2}\\,dt$，则 $F'(x)$ 等于？", "Let $F(x)=\\displaystyle\\int_0^x e^{-t^2}\\,dt$. Then $F'(x)$ equals"),
    options: [b("$e^{-x^2}$", "$e^{-x^2}$"), b("$-2xe^{-x^2}$", "$-2xe^{-x^2}$"), b("$\\int e^{-x^2}dx$", "$\\int e^{-x^2}dx$"), b("$0$", "$0$")],
    correct: 0,
    hint: b("微积分基本定理的第一部分。", "The first part of the fundamental theorem of calculus."),
    solution: b("被积函数连续，所以 $\\frac{d}{dx}\\int_0^x f(t)\\,dt=f(x)=e^{-x^2}$。", "The integrand is continuous, so $\\frac{d}{dx}\\int_0^x f(t)\\,dt=f(x)=e^{-x^2}$."),
  },
  // ---- taylor ----
  {
    id: "taylor-1", concept: "taylor-series", kind: "numeric",
    statement: b("$\\sin x$ 在 $x=0$ 处的 Taylor 级数中，$x^3$ 的系数是多少（保留四位小数）？", "In the Taylor series of $\\sin x$ at $0$, what is the coefficient of $x^3$ (four decimals)?"),
    answer: -1 / 6, tolerance: 6e-5,
    hint: b("系数是 $f^{(3)}(0)/3!$。", "The coefficient is $f^{(3)}(0)/3!$."),
    solution: b("$\\sin'''(x)=-\\cos x$，$\\sin'''(0)=-1$，系数为 $-1/6$。", "$\\sin'''(x)=-\\cos x$, so $\\sin'''(0)=-1$ and the coefficient is $-1/6$."),
  },
  {
    id: "taylor-2", concept: "taylor-series", kind: "choice",
    statement: b("用 $1-\\tfrac{x^2}{2}$ 近似 $\\cos x$，当 $|x|\\le 0.5$ 时，Lagrange 余项能给出的最紧误差上界最接近下列哪个？", "Approximating $\\cos x$ by $1-\\tfrac{x^2}{2}$ for $|x|\\le0.5$, the sharpest bound the Lagrange remainder gives on the error is approximately"),
    options: [b("$0.0026$", "$0.0026$"), b("$0.0208$", "$0.0208$"), b("$0.125$", "$0.125$"), b("$0.5$", "$0.5$")],
    correct: 0,
    hint: b("$x^3$ 项系数为 0，所以余项是四阶的：$|R|\\le\\frac{|x|^4}{4!}$。", "The $x^3$ coefficient is $0$, so the remainder is fourth order: $|R|\\le\\frac{|x|^4}{4!}$."),
    solution: b("$|R_3(x)|\\le\\frac{\\max|\\cos^{(4)}|\\,|x|^4}{24}\\le\\frac{0.5^4}{24}\\approx0.0026$。", "$|R_3(x)|\\le\\frac{\\max|\\cos^{(4)}|\\,|x|^4}{24}\\le\\frac{0.5^4}{24}\\approx0.0026$."),
  },
  // ---- vectors ----
  {
    id: "vectors-1", concept: "vectors", kind: "numeric",
    statement: b("向量 $(1,0,1),(0,1,1),(1,1,2)$ 在 $\\mathbb R^3$ 中张成的子空间维数是多少？", "What is the dimension of the subspace of $\\mathbb R^3$ spanned by $(1,0,1),(0,1,1),(1,1,2)$?"),
    answer: 2, tolerance: 1e-9,
    hint: b("检查第三个向量是否是前两个的线性组合。", "Check whether the third vector is a combination of the first two."),
    solution: b("$(1,1,2)=(1,0,1)+(0,1,1)$，而前两个线性无关，故维数为 2。", "$(1,1,2)=(1,0,1)+(0,1,1)$, and the first two are independent, so the dimension is 2."),
  },
  {
    id: "vectors-2", concept: "vectors", kind: "choice",
    statement: b("在通常的加法与数乘下，下列哪个集合**不是**向量空间？", "Under the usual operations, which of these is **not** a vector space?"),
    options: [b("次数 $\\le 2$ 的全体实多项式", "All real polynomials of degree $\\le2$"), b("次数**恰为** 2 的全体实多项式", "All real polynomials of degree **exactly** 2"), b("$\\mathbb R^n$", "$\\mathbb R^n$"), b("全体 $2\\times2$ 实矩阵", "All $2\\times2$ real matrices")],
    correct: 1,
    hint: b("向量空间必须对加法封闭。", "A vector space must be closed under addition."),
    solution: b("$x^2$ 与 $-x^2+x$ 的和是 $x$，次数为 1，不在集合中，因此不封闭。", "$x^2+(-x^2+x)=x$ has degree 1 and is not in the set, so it is not closed."),
  },
  // ---- inner product ----
  {
    id: "inner-product-1", concept: "inner-product", kind: "numeric",
    statement: b("求向量 $u=(1,2,2)$ 与 $v=(2,-1,2)$ 夹角的余弦（保留三位小数）。", "Find the cosine of the angle between $u=(1,2,2)$ and $v=(2,-1,2)$ (three decimals)."),
    answer: 4 / 9, tolerance: 6e-4,
    hint: b("$\\cos\\theta=\\dfrac{\\langle u,v\\rangle}{\\|u\\|\\,\\|v\\|}$。", "$\\cos\\theta=\\dfrac{\\langle u,v\\rangle}{\\|u\\|\\,\\|v\\|}$."),
    solution: b("$\\langle u,v\\rangle=2-2+4=4$，$\\|u\\|=\\|v\\|=3$，所以 $\\cos\\theta=4/9\\approx0.444$。", "$\\langle u,v\\rangle=2-2+4=4$, $\\|u\\|=\\|v\\|=3$, so $\\cos\\theta=4/9\\approx0.444$."),
  },
  {
    id: "inner-product-2", concept: "inner-product", kind: "choice",
    statement: b("对实数 $a_1,\\dots,a_n$，Cauchy–Schwarz 不等式给出 $(a_1+\\cdots+a_n)^2\\le C\\,(a_1^2+\\cdots+a_n^2)$。最小的常数 $C$ 是？", "For reals $a_1,\\dots,a_n$, Cauchy–Schwarz gives $(a_1+\\cdots+a_n)^2\\le C\\,(a_1^2+\\cdots+a_n^2)$. The smallest such $C$ is"),
    options: [b("$1$", "$1$"), b("$\\sqrt n$", "$\\sqrt n$"), b("$n$", "$n$"), b("$n^2$", "$n^2$")],
    correct: 2,
    hint: b("取 $b=(1,1,\\dots,1)$。", "Take $b=(1,1,\\dots,1)$."),
    solution: b("$\\langle a,b\\rangle^2\\le\\|a\\|^2\\|b\\|^2$ 且 $\\|b\\|^2=n$；$a=b$ 时取等，所以 $C=n$ 最小。", "$\\langle a,b\\rangle^2\\le\\|a\\|^2\\|b\\|^2$ with $\\|b\\|^2=n$; equality at $a=b$, so $C=n$ is sharp."),
  },
  // ---- linear maps ----
  {
    id: "linear-maps-1", concept: "linear-maps", kind: "numeric",
    statement: b("线性映射 $T:\\mathbb R^2\\to\\mathbb R^2$ 满足 $T(1,0)=(2,1)$，$T(0,1)=(0,3)$。求 $T(1,2)$ 的第二个坐标。", "A linear map $T:\\mathbb R^2\\to\\mathbb R^2$ has $T(1,0)=(2,1)$ and $T(0,1)=(0,3)$. Find the second coordinate of $T(1,2)$."),
    answer: 7, tolerance: 1e-9,
    hint: b("$(1,2)=1\\cdot(1,0)+2\\cdot(0,1)$，再用线性性。", "$(1,2)=1\\cdot(1,0)+2\\cdot(0,1)$; now use linearity."),
    solution: b("$T(1,2)=T(1,0)+2T(0,1)=(2,1)+(0,6)=(2,7)$。", "$T(1,2)=T(1,0)+2T(0,1)=(2,1)+(0,6)=(2,7)$."),
  },
  {
    id: "linear-maps-2", concept: "linear-maps", kind: "choice",
    statement: b("下列哪个映射是线性的？", "Which of the following maps is linear?"),
    options: [b("$f(x,y)=(x+y,\\,2x)$", "$f(x,y)=(x+y,\\,2x)$"), b("$f(x,y)=(x+1,\\,y)$", "$f(x,y)=(x+1,\\,y)$"), b("$f(x,y)=(xy,\\,0)$", "$f(x,y)=(xy,\\,0)$"), b("$f(x)=x^2$", "$f(x)=x^2$")],
    correct: 0,
    hint: b("线性映射一定把 $0$ 映到 $0$，并且 $f(cv)=cf(v)$。", "A linear map sends $0$ to $0$ and satisfies $f(cv)=cf(v)$."),
    solution: b("只有第一个同时满足 $f(u+v)=f(u)+f(v)$ 与 $f(cv)=cf(v)$；其余分别违反 $f(0)=0$ 或齐次性。", "Only the first satisfies both $f(u+v)=f(u)+f(v)$ and $f(cv)=cf(v)$; the others fail $f(0)=0$ or homogeneity."),
  },
  // ---- matrices ----
  {
    id: "matrices-1", concept: "matrices", kind: "numeric",
    statement: b("求 $\\det\\begin{pmatrix}2&1\\\\3&4\\end{pmatrix}$。", "Compute $\\det\\begin{pmatrix}2&1\\\\3&4\\end{pmatrix}$."),
    answer: 5, tolerance: 1e-9,
    hint: b("行列式是变换后单位正方形的有向面积。", "The determinant is the signed area of the transformed unit square."),
    solution: b("$2\\cdot4-1\\cdot3=5$。", "$2\\cdot4-1\\cdot3=5$."),
  },
  {
    id: "matrices-2", concept: "matrices", kind: "choice",
    statement: b("逆时针旋转 $90^\\circ$ 的线性变换，在标准基下的矩阵是？", "The matrix (in the standard basis) of the counter-clockwise rotation by $90^\\circ$ is"),
    options: [b("$\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}$", "$\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}$"), b("$\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$", "$\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$"), b("$\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$", "$\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$"), b("$\\begin{pmatrix}0&1\\\\-1&0\\end{pmatrix}$", "$\\begin{pmatrix}0&1\\\\-1&0\\end{pmatrix}$")],
    correct: 2,
    hint: b("矩阵的列就是 $e_1,e_2$ 的像。$e_1$ 转到哪里？", "The columns are the images of $e_1,e_2$. Where does $e_1$ go?"),
    solution: b("$e_1\\mapsto(0,1)$，$e_2\\mapsto(-1,0)$，把它们作为列即得 $\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$。", "$e_1\\mapsto(0,1)$ and $e_2\\mapsto(-1,0)$; writing these as columns gives $\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$."),
  },
  // ---- eigenvalues ----
  {
    id: "eigenvalues-1", concept: "eigenvalues", kind: "numeric",
    statement: b("求 $\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$ 的最大特征值。", "Find the largest eigenvalue of $\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$."),
    answer: 3, tolerance: 1e-9,
    hint: b("特征多项式 $\\lambda^2-(\\operatorname{tr}A)\\lambda+\\det A$。", "Characteristic polynomial: $\\lambda^2-(\\operatorname{tr}A)\\lambda+\\det A$."),
    solution: b("$\\lambda^2-4\\lambda+3=(\\lambda-1)(\\lambda-3)$，最大特征值为 3，对应特征向量 $(1,1)$。", "$\\lambda^2-4\\lambda+3=(\\lambda-1)(\\lambda-3)$; the largest eigenvalue is 3 with eigenvector $(1,1)$."),
  },
  {
    id: "eigenvalues-2", concept: "eigenvalues", kind: "choice",
    statement: b("剪切矩阵 $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ 的特征向量是？", "The eigenvectors of the shear $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ are"),
    options: [b("只有 $(1,0)$ 的非零倍数", "Only nonzero multiples of $(1,0)$"), b("只有 $(0,1)$ 的非零倍数", "Only nonzero multiples of $(0,1)$"), b("平面上所有非零向量", "Every nonzero vector in the plane"), b("没有实特征向量", "There are no real eigenvectors")],
    correct: 0,
    hint: b("特征值是 $1$（二重）。解 $(A-I)v=0$。", "The eigenvalue is $1$ (double). Solve $(A-I)v=0$."),
    solution: b("$A-I=\\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}$，$(A-I)v=0$ 迫使 $v_2=0$，所以特征空间只有一维：水平方向不动。", "$A-I=\\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}$ forces $v_2=0$, so the eigenspace is one-dimensional: the horizontal direction is fixed."),
  },
  // ---- what is an ODE ----
  {
    id: "what-is-ode-1", concept: "what-is-ode", kind: "numeric",
    statement: b("解初值问题 $y'=2y,\\ y(0)=3$，求 $y(1)$（保留两位小数）。", "Solve $y'=2y,\\ y(0)=3$ and give $y(1)$ to two decimals."),
    answer: 3 * Math.exp(2), tolerance: 6e-3,
    hint: b("先猜 $y=Ce^{kt}$，代入确定 $k$ 与 $C$。", "Guess $y=Ce^{kt}$ and substitute to fix $k$ and $C$."),
    solution: b("$y=3e^{2t}$，$y(1)=3e^2\\approx22.17$。", "$y=3e^{2t}$, so $y(1)=3e^2\\approx22.17$."),
  },
  {
    id: "what-is-ode-2", concept: "what-is-ode", kind: "choice",
    statement: b("方程 $y'''+y\\,y'=\\sin t$ 的阶是？", "What is the order of $y'''+y\\,y'=\\sin t$?"),
    options: [b("1", "1"), b("2", "2"), b("3", "3"), b("它是非线性的，所以没有阶", "It is nonlinear, so it has no order")],
    correct: 2,
    hint: b("阶只看出现的最高阶导数。", "The order is the highest derivative that appears."),
    solution: b("最高阶导数是 $y'''$，所以是三阶方程；非线性与阶无关。", "The highest derivative is $y'''$, so the order is 3. Nonlinearity is a separate matter."),
  },
  // ---- first-order ----
  {
    id: "first-order-ode-1", concept: "first-order-ode", kind: "numeric",
    statement: b("解 $y'=y^2,\\ y(0)=1$，求 $y(0.5)$。", "Solve $y'=y^2,\\ y(0)=1$ and find $y(0.5)$."),
    answer: 2, tolerance: 1e-6,
    hint: b("分离变量：$\\int y^{-2}\\,dy=\\int dt$。", "Separate variables: $\\int y^{-2}\\,dy=\\int dt$."),
    solution: b("$-1/y=t+C$，由 $y(0)=1$ 得 $C=-1$，$y=\\frac{1}{1-t}$，$y(0.5)=2$。注意解在 $t=1$ 处爆破。", "$-1/y=t+C$, $C=-1$ from $y(0)=1$, so $y=\\frac1{1-t}$ and $y(0.5)=2$. Note the solution blows up at $t=1$."),
  },
  {
    id: "first-order-ode-2", concept: "first-order-ode", kind: "choice",
    statement: b("解 $y'+2y=e^t$ 时应乘的积分因子是？", "Which integrating factor solves $y'+2y=e^t$?"),
    options: [b("$e^{2t}$", "$e^{2t}$"), b("$e^{t}$", "$e^{t}$"), b("$e^{-2t}$", "$e^{-2t}$"), b("$2$", "$2$")],
    correct: 0,
    hint: b("我们想让左边变成 $(\\mu y)'$。", "We want the left side to become $(\\mu y)'$."),
    solution: b("取 $\\mu=e^{\\int 2\\,dt}=e^{2t}$，则 $(e^{2t}y)'=e^{3t}$。", "Take $\\mu=e^{\\int2\\,dt}=e^{2t}$; then $(e^{2t}y)'=e^{3t}$."),
  },
  // ---- second-order ----
  {
    id: "second-order-linear-ode-1", concept: "second-order-linear-ode", kind: "numeric",
    statement: b("$y''-3y'+2y=0$ 的特征方程较大的根是多少？", "What is the larger root of the characteristic equation of $y''-3y'+2y=0$?"),
    answer: 2, tolerance: 1e-9,
    hint: b("代入 $y=e^{rt}$。", "Substitute $y=e^{rt}$."),
    solution: b("$r^2-3r+2=(r-1)(r-2)=0$，根为 1 与 2。", "$r^2-3r+2=(r-1)(r-2)=0$, roots 1 and 2."),
  },
  {
    id: "second-order-linear-ode-2", concept: "second-order-linear-ode", kind: "choice",
    statement: b("$y''+4y=0$ 的通解是？", "The general solution of $y''+4y=0$ is"),
    options: [b("$C_1e^{2t}+C_2e^{-2t}$", "$C_1e^{2t}+C_2e^{-2t}$"), b("$C_1\\cos2t+C_2\\sin2t$", "$C_1\\cos2t+C_2\\sin2t$"), b("$(C_1+C_2t)e^{-2t}$", "$(C_1+C_2t)e^{-2t}$"), b("$C_1\\cos4t+C_2\\sin4t$", "$C_1\\cos4t+C_2\\sin4t$")],
    correct: 1,
    hint: b("特征根是纯虚数 $\\pm2i$。", "The characteristic roots are $\\pm2i$."),
    solution: b("$r^2+4=0\\Rightarrow r=\\pm2i$，实解为 $\\cos2t$ 与 $\\sin2t$ 的线性组合。", "$r^2+4=0\\Rightarrow r=\\pm2i$, giving real solutions $\\cos2t$ and $\\sin2t$."),
  },
  // ---- numerical ----
  {
    id: "numerical-ode-1", concept: "numerical-ode", kind: "numeric",
    statement: b("对 $y'=y,\\ y(0)=1$ 用步长 $h=0.5$ 的 Euler 法走两步，得到的 $y(1)$ 近似值是多少？", "Apply Euler's method with $h=0.5$ to $y'=y,\\ y(0)=1$ for two steps. What approximation of $y(1)$ results?"),
    answer: 2.25, tolerance: 1e-9,
    hint: b("每一步 $y_{n+1}=y_n+h\\,y_n=(1+h)y_n$。", "Each step is $y_{n+1}=y_n+h\\,y_n=(1+h)y_n$."),
    solution: b("$y_2=(1.5)^2=2.25$，而精确值 $e\\approx2.718$。", "$y_2=(1.5)^2=2.25$, versus the exact value $e\\approx2.718$."),
  },
  {
    id: "numerical-ode-2", concept: "numerical-ode", kind: "choice",
    statement: b("RK4 的全局误差是 $O(h^4)$。把步长减半，误差大约变为原来的几分之一？", "RK4 has global error $O(h^4)$. Halving the step size divides the error by roughly"),
    options: [b("2", "2"), b("4", "4"), b("8", "8"), b("16", "16")],
    correct: 3,
    hint: b("$(h/2)^4=h^4/16$。", "$(h/2)^4=h^4/16$."),
    solution: b("误差与 $h^4$ 成比例，所以减半后约为 $1/16$。", "Error scales like $h^4$, so halving $h$ divides it by about 16."),
  },
  // ---- probability space ----
  {
    id: "probability-space-1", concept: "probability-space", kind: "numeric",
    statement: b("掷两颗均匀骰子，点数之和为 $7$ 的概率是多少？（可以填分数）", "Roll two fair dice. What is the probability that the sum is $7$? (A fraction is fine.)"),
    answer: 1 / 6, tolerance: 1e-3,
    hint: b("样本空间是有序对 $(i,j)$，共 $36$ 个，等可能。", "The sample space is the $36$ equally likely ordered pairs $(i,j)$."),
    solution: b("和为 $7$ 的有序对是 $(1,6),(2,5),\\dots,(6,1)$，共 $6$ 个，概率 $\\frac6{36}=\\frac16$。注意 $(1,6)$ 与 $(6,1)$ 是不同的样本点。", "The ordered pairs with sum $7$ are $(1,6),(2,5),\\dots,(6,1)$: six of them, so the probability is $\\frac6{36}=\\frac16$. Note that $(1,6)$ and $(6,1)$ are different outcomes."),
  },
  {
    id: "probability-space-2", concept: "probability-space", kind: "numeric",
    statement: b("已知 $P(A)=0.5$，$P(B)=0.4$，$P(A\\cup B)=0.7$。求 $P(A\\cap B)$。", "Given $P(A)=0.5$, $P(B)=0.4$ and $P(A\\cup B)=0.7$, find $P(A\\cap B)$."),
    answer: 0.2, tolerance: 1e-6,
    hint: b("用加法公式 $P(A\\cup B)=P(A)+P(B)-P(A\\cap B)$。", "Use $P(A\\cup B)=P(A)+P(B)-P(A\\cap B)$."),
    solution: b("$P(A\\cap B)=0.5+0.4-0.7=0.2$。$P(A)+P(B)=0.9>0.7$，多出的 $0.2$ 正是交集被数了两次的部分。", "$P(A\\cap B)=0.5+0.4-0.7=0.2$. The sum $P(A)+P(B)=0.9$ exceeds $0.7$ by exactly the intersection, which was counted twice."),
  },
  {
    id: "probability-space-3", concept: "probability-space", kind: "numeric",
    statement: b("$3$ 个人中至少两人同一天生日的概率是多少？（按 $365$ 天均匀计，保留四位小数）", "What is the probability that among $3$ people at least two share a birthday? (Uniform over $365$ days; four decimals.)"),
    answer: 1 - (364 * 363) / (365 * 365), tolerance: 6e-5,
    hint: b("先算补事件\"三人生日两两不同\"。", "Compute the complement first: all three birthdays different."),
    solution: b("$1-\\frac{365\\cdot364\\cdot363}{365^3}=1-\\frac{364\\cdot363}{365^2}\\approx0.0082$。和 $\\binom32\\cdot\\frac1{365}\\approx0.0082$ 几乎一样：人少时，概率约等于\"对数 × 每对撞上的概率\"。", "$1-\\frac{365\\cdot364\\cdot363}{365^3}=1-\\frac{364\\cdot363}{365^2}\\approx0.0082$, almost exactly $\\binom32\\cdot\\frac1{365}\\approx0.0082$: for small groups the probability is about \"pairs × chance per pair\"."),
  },
  {
    id: "probability-space-4", concept: "probability-space", kind: "choice",
    statement: b("一个 $23$ 人的班里，**有人和你同一天生日**（你是其中之一）的概率约为？", "In a class of $23$ that includes you, the probability that **someone shares your birthday** is about"),
    options: [b("$6\\%$", "$6\\%$"), b("$25\\%$", "$25\\%$"), b("$51\\%$", "$51\\%$"), b("$94\\%$", "$94\\%$")],
    correct: 0,
    hint: b("这里只有 $22$ 对：你和其他每个人。", "Only $22$ pairs matter here: you and each other person."),
    solution: b("$1-\\bigl(\\frac{364}{365}\\bigr)^{22}\\approx0.059$。$51\\%$ 是\"任意两人同一天\"的概率，那里有 $253$ 对。", "$1-\\bigl(\\frac{364}{365}\\bigr)^{22}\\approx0.059$. The $51\\%$ is for \"some two people share\", which involves $253$ pairs."),
  },
  // ---- conditional probability ----
  {
    id: "conditional-probability-1", concept: "conditional-probability", kind: "numeric",
    statement: b("掷两颗均匀骰子，已知点数之和为 $8$，求第一颗是 $6$ 的条件概率。（可以填分数）", "Roll two fair dice. Given that the sum is $8$, what is the probability that the first die shows $6$? (A fraction is fine.)"),
    answer: 1 / 5, tolerance: 1e-3,
    hint: b("已知条件把样本空间缩小成和为 $8$ 的那些有序对。", "The condition shrinks the sample space to the ordered pairs with sum $8$."),
    solution: b("和为 $8$ 的有序对是 $(2,6),(3,5),(4,4),(5,3),(6,2)$，共 $5$ 个，其中第一颗是 $6$ 的只有 $(6,2)$，所以是 $\\frac15$。它比无条件的 $\\frac16$ 大：知道和较大，第一颗大的可能性就上升了。", "The ordered pairs with sum $8$ are $(2,6),(3,5),(4,4),(5,3),(6,2)$: five of them, and only $(6,2)$ has a $6$ first, so the answer is $\\frac15$. It exceeds the unconditional $\\frac16$: a large sum makes a large first die more likely."),
  },
  {
    id: "conditional-probability-2", concept: "conditional-probability", kind: "numeric",
    statement: b("甲、乙两台机器分别生产 $60\\%$ 和 $40\\%$ 的零件，次品率分别为 $2\\%$ 和 $5\\%$。随机抽到一个次品，它来自乙的概率是多少？（保留三位小数）", "Machines A and B make $60\\%$ and $40\\%$ of the parts, with defect rates $2\\%$ and $5\\%$. A randomly chosen part is defective. What is the probability it came from B? (Three decimals.)"),
    answer: 0.625, tolerance: 6e-4,
    hint: b("先用全概率公式算出次品的总概率。", "First find the total probability of a defect with the law of total probability."),
    solution: b("$P(\\text{次})=0.6\\times0.02+0.4\\times0.05=0.032$，$P(\\text{乙}\\mid\\text{次})=\\frac{0.4\\times0.05}{0.032}=0.625$。乙只生产四成，却贡献了六成多的次品。", "$P(\\text{defect})=0.6\\times0.02+0.4\\times0.05=0.032$, so $P(B\\mid\\text{defect})=\\frac{0.4\\times0.05}{0.032}=0.625$. B makes only 40% of the parts but over 60% of the defects."),
  },
  {
    id: "conditional-probability-3", concept: "conditional-probability", kind: "choice",
    statement: b("设 $P(A)>0$，$P(B)>0$，且 $A$ 与 $B$ 互斥。那么 $A$ 与 $B$：", "Let $P(A)>0$, $P(B)>0$, and let $A$ and $B$ be mutually exclusive. Then $A$ and $B$ are"),
    options: [b("一定独立", "always independent"), b("一定不独立", "never independent"), b("可能独立也可能不独立", "sometimes independent, sometimes not"), b("独立当且仅当 $P(A)=P(B)$", "independent exactly when $P(A)=P(B)$")],
    correct: 1,
    hint: b("比较 $P(A\\cap B)$ 与 $P(A)P(B)$。", "Compare $P(A\\cap B)$ with $P(A)P(B)$."),
    solution: b("互斥给出 $P(A\\cap B)=0$，而 $P(A)P(B)>0$，所以乘积公式不成立。直观上，$A$ 发生就排除了 $B$，这是最强的相关。", "Exclusivity gives $P(A\\cap B)=0$ while $P(A)P(B)>0$, so the product rule fails. Intuitively, $A$ occurring rules $B$ out: the strongest kind of dependence."),
  },
  {
    id: "conditional-probability-4", concept: "conditional-probability", kind: "numeric",
    statement: b("沿用正文的检测：患病率 $1\\%$，灵敏度 $95\\%$，误报率 $8\\%$。某人连续两次检测都呈阳性（两次检测在是否患病已知时条件独立），他患病的概率是多少？（保留两位小数）", "Use the test from the article: prevalence $1\\%$, sensitivity $95\\%$, false-positive rate $8\\%$. Someone tests positive twice (the tests are conditionally independent given the true state). What is the probability that they are ill? (Two decimals.)"),
    answer: (0.95 * 0.95 * 0.01) / (0.95 * 0.95 * 0.01 + 0.08 * 0.08 * 0.99), tolerance: 0.006,
    hint: b("把第一次的后验当作第二次的先验；或者直接用 $P(++\\mid\\text{病})=0.95^2$。", "Use the first posterior as the second prior, or directly $P(++\\mid\\text{ill})=0.95^2$."),
    solution: b("$\\frac{0.95^2\\times0.01}{0.95^2\\times0.01+0.08^2\\times0.99}=\\frac{0.009025}{0.009025+0.006336}\\approx0.59$。分两步算（$0.01\\to0.107\\to0.59$）结果相同：条件独立时，Bayes 更新可以一条一条地做。", "$\\frac{0.95^2\\times0.01}{0.95^2\\times0.01+0.08^2\\times0.99}=\\frac{0.009025}{0.009025+0.006336}\\approx0.59$. Doing it in two steps ($0.01\\to0.107\\to0.59$) gives the same result: with conditional independence, Bayesian updates can be done one piece of evidence at a time."),
  },
  // ---- random variables ----
  {
    id: "random-variables-1", concept: "random-variables", kind: "numeric",
    statement: b("抛一枚均匀硬币 $10$ 次，恰好出现 $3$ 次正面的概率是多少？（保留四位小数，也可以填分数）", "Toss a fair coin $10$ times. What is the probability of exactly $3$ heads? (Four decimals, or a fraction.)"),
    answer: 120 / 1024, tolerance: 6e-5,
    hint: b("$X\\sim B(10,\\tfrac12)$。先数有多少个正反序列恰好含 $3$ 个正面。", "$X\\sim B(10,\\tfrac12)$. First count the head–tail sequences with exactly $3$ heads."),
    solution: b("$P(X=3)=\\binom{10}{3}\\bigl(\\tfrac12\\bigr)^{3}\\bigl(\\tfrac12\\bigr)^{7}=\\frac{120}{1024}\\approx0.1172$。每个具体的序列概率都是 $2^{-10}$，含 $3$ 个正面的序列有 $\\binom{10}3=120$ 个。", "$P(X=3)=\\binom{10}{3}\\bigl(\\tfrac12\\bigr)^{3}\\bigl(\\tfrac12\\bigr)^{7}=\\frac{120}{1024}\\approx0.1172$. Each particular sequence has probability $2^{-10}$, and $\\binom{10}3=120$ sequences contain exactly $3$ heads."),
  },
  {
    id: "random-variables-2", concept: "random-variables", kind: "numeric",
    statement: b("一本书有 $500$ 页，全书共有 $250$ 处印刷错误，每处错误独立、等可能地落在任何一页。用 Poisson 近似，求某一页**没有**错误的概率。（保留三位小数）", "A book has $500$ pages and $250$ misprints, each landing independently on a page chosen uniformly at random. Using the Poisson approximation, find the probability that a given page has **no** misprints. (Three decimals.)"),
    answer: Math.exp(-0.5), tolerance: 6e-4,
    hint: b("某一页上的错误数是 $B(250,\\tfrac1{500})$：$n$ 大、$p$ 小。$\\lambda=np$ 是多少？", "The number of misprints on one page is $B(250,\\tfrac1{500})$: large $n$, small $p$. What is $\\lambda=np$?"),
    solution: b("$\\lambda=250\\times\\frac1{500}=0.5$，$P(Y=0)=e^{-0.5}\\approx0.607$。精确值 $\\bigl(1-\\tfrac1{500}\\bigr)^{250}\\approx0.606$，相差不到 $0.001$。", "$\\lambda=250\\times\\frac1{500}=0.5$ and $P(Y=0)=e^{-0.5}\\approx0.607$. The exact value $\\bigl(1-\\tfrac1{500}\\bigr)^{250}\\approx0.606$ differs by less than $0.001$."),
  },
  {
    id: "random-variables-3", concept: "random-variables", kind: "choice",
    statement: b("设 $X\\sim B(11,\\tfrac12)$。$X$ 最可能取哪个值？", "Let $X\\sim B(11,\\tfrac12)$. Which value is $X$ most likely to take?"),
    options: [b("$5$", "$5$"), b("$6$", "$6$"), b("$5.5$", "$5.5$"), b("$5$ 和 $6$ 一样可能，都是最可能的值", "$5$ and $6$ are equally likely, and both are most likely")],
    correct: 3,
    hint: b("看相邻两项之比 $\\dfrac{P(X=k)}{P(X=k-1)}=\\dfrac{(n-k+1)p}{k(1-p)}$，并算出 $(n+1)p$。", "Look at the ratio $\\dfrac{P(X=k)}{P(X=k-1)}=\\dfrac{(n-k+1)p}{k(1-p)}$ and compute $(n+1)p$."),
    solution: b("$(n+1)p=6$ 是整数。$k=6$ 时比值 $\\frac{6\\cdot\\frac12}{6\\cdot\\frac12}=1$，所以 $P(X=6)=P(X=5)=\\frac{462}{2048}$，两者并列最大；$k<6$ 时比值大于 $1$，$k>6$ 时小于 $1$。", "$(n+1)p=6$ is a whole number. At $k=6$ the ratio is $\\frac{6\\cdot\\frac12}{6\\cdot\\frac12}=1$, so $P(X=6)=P(X=5)=\\frac{462}{2048}$, tied for the maximum; the ratio exceeds $1$ for $k<6$ and is below $1$ for $k>6$."),
  },
  {
    id: "random-variables-4", concept: "random-variables", kind: "choice",
    statement: b("$B(10,\\,0.5)$ 与 $B(1000,\\,0.005)$ 的均值都是 $5$。哪一个更接近 Poisson 分布 $\\mathrm{Poisson}(5)$？", "$B(10,\\,0.5)$ and $B(1000,\\,0.005)$ both have mean $5$. Which is closer to $\\mathrm{Poisson}(5)$?"),
    options: [b("$B(10,\\,0.5)$", "$B(10,\\,0.5)$"), b("$B(1000,\\,0.005)$", "$B(1000,\\,0.005)$"), b("一样接近，因为 $np$ 相同", "Equally close, since $np$ is the same"), b("两个都不接近", "Neither is close")],
    correct: 1,
    hint: b("比较二项分布的方差 $np(1-p)$ 与 Poisson 分布的方差 $\\lambda$。", "Compare the binomial variance $np(1-p)$ with the Poisson variance $\\lambda$."),
    solution: b("Poisson 近似要求 $p$ 小。$B(1000,0.005)$ 的方差 $4.975$ 几乎就是 $5$，与 $\\mathrm{Poisson}(5)$ 的距离约 $0.0012$；$B(10,0.5)$ 的方差只有 $2.5$，而且取不到 $10$ 以上的值，距离约 $0.17$。", "The Poisson approximation needs small $p$. $B(1000,0.005)$ has variance $4.975$, almost exactly $5$, and lies about $0.0012$ from $\\mathrm{Poisson}(5)$; $B(10,0.5)$ has variance only $2.5$ and never exceeds $10$, and lies about $0.17$ away."),
  },
  // ---- expectation-variance ----
  {
    id: "expectation-variance-1", concept: "expectation-variance", kind: "numeric",
    statement: b("掷两枚均匀骰子，点数之和的方差是多少？（保留三位小数，也可以填分数）", "Roll two fair dice. What is the variance of the total? (Three decimals, or a fraction.)"),
    answer: 35 / 6, tolerance: 6e-4,
    hint: b("先用 $\\operatorname{Var}X=EX^2-(EX)^2$ 算一枚骰子的方差；两枚骰子相互独立。", "First compute the variance of one die with $\\operatorname{Var}X=EX^2-(EX)^2$; the two dice are independent."),
    solution: b("一枚骰子 $EX=3.5$，$EX^2=\\frac{1+4+\\dots+36}6=\\frac{91}6$，方差 $\\frac{91}6-\\frac{49}4=\\frac{35}{12}$。两枚独立，方差相加：$\\frac{35}{12}\\times2=\\frac{35}6\\approx5.833$。", "For one die $EX=3.5$ and $EX^2=\\frac{1+4+\\dots+36}6=\\frac{91}6$, so the variance is $\\frac{91}6-\\frac{49}4=\\frac{35}{12}$. The dice are independent, so variances add: $\\frac{35}{12}\\times2=\\frac{35}6\\approx5.833$."),
  },
  {
    id: "expectation-variance-2", concept: "expectation-variance", kind: "numeric",
    statement: b("两台仪器的误差期望都是 $0$，标准差都是 $2$ mm，相关系数是 $0.5$。两个读数取平均，平均值误差的标准差是多少 mm？（保留三位小数）", "Two instruments have errors with mean $0$, standard deviation $2$ mm each, and correlation $0.5$. Averaging the two readings, what is the standard deviation of the error of the average, in mm? (Three decimals.)"),
    answer: Math.sqrt(3), tolerance: 6e-4,
    hint: b("先算 $\\operatorname{Var}\\frac{X+Y}2$，其中 $\\operatorname{Cov}(X,Y)=\\rho\\,\\sigma_X\\sigma_Y$；最后开方。", "First compute $\\operatorname{Var}\\frac{X+Y}2$ using $\\operatorname{Cov}(X,Y)=\\rho\\,\\sigma_X\\sigma_Y$; take the square root at the end."),
    solution: b("$\\operatorname{Cov}(X,Y)=0.5\\times2\\times2=2$，$\\operatorname{Var}\\frac{X+Y}2=\\frac{4+4+2\\times2}4=3$，标准差 $\\sqrt3\\approx1.732$ mm。误差独立时是 $\\sqrt2\\approx1.414$ mm：相关性吃掉了取平均的一部分好处。", "$\\operatorname{Cov}(X,Y)=0.5\\times2\\times2=2$ and $\\operatorname{Var}\\frac{X+Y}2=\\frac{4+4+2\\times2}4=3$, so the standard deviation is $\\sqrt3\\approx1.732$ mm. With independent errors it would be $\\sqrt2\\approx1.414$ mm: the correlation eats part of the gain from averaging."),
  },
  {
    id: "expectation-variance-3", concept: "expectation-variance", kind: "choice",
    statement: b("$X$ 等可能地取 $-1,0,1$，$Y=X^2$。下列说法哪个正确？", "$X$ takes $-1,0,1$ with equal probability, and $Y=X^2$. Which statement is true?"),
    options: [b("$X$ 与 $Y$ 相互独立", "$X$ and $Y$ are independent"), b("$\\operatorname{Cov}(X,Y)=0$，但 $X$ 与 $Y$ 不独立", "$\\operatorname{Cov}(X,Y)=0$, but $X$ and $Y$ are not independent"), b("$\\operatorname{Cov}(X,Y)>0$，因为 $|X|$ 越大 $Y$ 越大", "$\\operatorname{Cov}(X,Y)>0$, because $Y$ grows with $|X|$"), b("$\\rho(X,Y)=1$，因为 $Y$ 由 $X$ 完全决定", "$\\rho(X,Y)=1$, because $Y$ is completely determined by $X$")],
    correct: 1,
    hint: b("先算 $\\operatorname{Cov}(X,Y)=E(XY)-EX\\cdot EY$，再比较 $P(X=0,\\,Y=0)$ 与 $P(X=0)\\,P(Y=0)$。", "Compute $\\operatorname{Cov}(X,Y)=E(XY)-EX\\cdot EY$, then compare $P(X=0,\\,Y=0)$ with $P(X=0)\\,P(Y=0)$."),
    solution: b("$EX=0$，$E(XY)=EX^3=\\frac{-1+0+1}3=0$，所以 $\\operatorname{Cov}(X,Y)=0$。但 $P(X=0,\\,Y=0)=\\frac13$，$P(X=0)\\,P(Y=0)=\\frac19$，两者不相等，所以不独立。协方差只衡量线性关系。", "$EX=0$ and $E(XY)=EX^3=\\frac{-1+0+1}3=0$, so $\\operatorname{Cov}(X,Y)=0$. But $P(X=0,\\,Y=0)=\\frac13$ while $P(X=0)\\,P(Y=0)=\\frac19$, so they are not independent. Covariance measures only linear dependence."),
  },
  {
    id: "expectation-variance-4", concept: "expectation-variance", kind: "choice",
    statement: b("$10$ 个人把帽子放在一起，再随机各拿一顶。拿回自己帽子的人数，期望是多少？", "$10$ people put their hats in a pile and each takes one at random. What is the expected number of people who get their own hat back?"),
    options: [b("$\\frac1{10}$", "$\\frac1{10}$"), b("$1$", "$1$"), b("约 $0.368$，即 $e^{-1}$", "about $0.368$, that is $e^{-1}$"), b("不能用线性性来算，因为这些事件不独立", "It cannot be found by linearity, because the events are not independent")],
    correct: 1,
    hint: b("把人数写成示性变量之和 $N=\\sum_i\\mathbf 1_{A_i}$。每个 $P(A_i)$ 是多少？", "Write the count as a sum of indicators, $N=\\sum_i\\mathbf 1_{A_i}$. What is each $P(A_i)$?"),
    solution: b("第 $i$ 个人拿对的概率是 $\\frac{9!}{10!}=\\frac1{10}$，由线性性 $EN=10\\times\\frac1{10}=1$。线性性不需要独立。$e^{-1}\\approx0.368$ 是“没有一个人拿对”的概率的近似值，不是期望。", "Person $i$ gets their own hat with probability $\\frac{9!}{10!}=\\frac1{10}$, so by linearity $EN=10\\times\\frac1{10}=1$. Linearity does not need independence. $e^{-1}\\approx0.368$ approximates the probability that nobody gets their own hat; it is not the expectation."),
  },
  // ---- central-limit-theorem ----
  {
    id: "central-limit-theorem-1", concept: "central-limit-theorem", kind: "numeric",
    statement: b("独立同分布的随机变量期望都是 $2$、标准差都是 $3$。取 $36$ 个变量求样本均值，样本均值的标准差是多少？", "Independent, identically distributed variables each have mean $2$ and standard deviation $3$. What is the standard deviation of the mean of $36$ variables?"),
    answer: 0.5, tolerance: 1e-6,
    hint: b("用 $\\operatorname{Var}\\bar X_n=\\sigma^2/n$，最后开方。", "Use $\\operatorname{Var}\\bar X_n=\\sigma^2/n$, then take the square root."),
    solution: b("$\\operatorname{Var}\\bar X_n=3^2/36=1/4$，所以标准差是 $\\sqrt{1/4}=0.5$。期望 $2$ 不改变宽度，只决定中心。", "$\\operatorname{Var}\\bar X_n=3^2/36=1/4$, so the standard deviation is $\\sqrt{1/4}=0.5$. The mean $2$ determines the centre, not the spread."),
  },
  {
    id: "central-limit-theorem-2", concept: "central-limit-theorem", kind: "numeric",
    statement: b("设 $X\\sim B(100,0.5)$。用正态近似和连续性修正估计 $P(45\\le X\\le55)$，保留三位小数。", "Let $X\\sim B(100,0.5)$. Estimate $P(45\\le X\\le55)$ using a normal approximation with continuity correction, to three decimals."),
    answer: 0.7286, tolerance: 6e-4,
    hint: b("$EX=50$，$\\sigma=5$；上下界分别取 $55.5$ 与 $44.5$。", "$EX=50$ and $\\sigma=5$; use $55.5$ and $44.5$ as the corrected boundaries."),
    solution: b("$z=(55.5-50)/5=1.1$，下界为 $(44.5-50)/5=-1.1$。于是概率约为 $\\Phi(1.1)-\\Phi(-1.1)=2\\Phi(1.1)-1\\approx2\\times0.8643-1=0.7286$。", "$z=(55.5-50)/5=1.1$, and the lower boundary is $(44.5-50)/5=-1.1$. Hence the probability is about $\\Phi(1.1)-\\Phi(-1.1)=2\\Phi(1.1)-1\\approx2\\times0.8643-1=0.7286$."),
  },
  {
    id: "central-limit-theorem-3", concept: "central-limit-theorem", kind: "choice",
    statement: b("关于独立同分布且方差有限的随机变量，下列哪个说法正确？", "For independent, identically distributed variables with finite variance, which statement is true?"),
    options: [b("$n$ 增大时，母分布会趋于正态分布", "As $n$ grows, the source distribution tends to normal"), b("大数定律给出标准化后的正态分布", "The law of large numbers gives a standard normal distribution after standardisation"), b("样本均值的标准差按 $1/\\sqrt n$ 缩小，标准化后的分布趋于 $N(0,1)$", "The sample mean's standard deviation shrinks like $1/\\sqrt n$, and its standardised distribution tends to $N(0,1)$"), b("样本均值的标准差按 $1/n$ 缩小，所以不需要看分布形状", "The sample mean's standard deviation shrinks like $1/n$, so the shape is irrelevant")],
    correct: 2,
    hint: b("分别回忆 $\\operatorname{Var}\\bar X_n$ 和中心极限定理的结论。", "Recall $\\operatorname{Var}\\bar X_n$ and the conclusion of the central limit theorem separately."),
    solution: b("样本均值的方差是 $\\sigma^2/n$，标准差是 $\\sigma/\\sqrt n$；中心极限定理讨论的是标准化后的分布趋于 $N(0,1)$，不是母分布变成正态，也不是大数定律直接给出正态分布。", "The sample mean has variance $\\sigma^2/n$ and standard deviation $\\sigma/\\sqrt n$. The central limit theorem says the standardised distribution tends to $N(0,1)$; the source does not become normal, and the law of large numbers does not itself produce a normal law."),
  },
  {
    id: "central-limit-theorem-4", concept: "central-limit-theorem", kind: "choice",
    statement: b("设 $X\\sim B(1000,0.005)$。要近似 $X$ 的分布，下列哪个判断更合适？", "Let $X\\sim B(1000,0.005)$. Which approximation is more appropriate for the distribution of $X$?"),
    options: [b("直接认为 $X$ 连续且服从正态分布，不需要考虑偏斜", "Treat $X$ as continuous and normal without considering skewness"), b("Poisson(5) 通常比正态近似更合适，因为 $p$ 很小", "Poisson(5) is usually more suitable than a normal approximation because $p$ is small"), b("只要 $n=1000$ 很大，任何近似都一定准确", "Since $n=1000$ is large, every approximation must be accurate"), b("$X$ 的期望是 $1000$，所以只能用正态近似", "$EX=1000$, so only a normal approximation is possible")],
    correct: 1,
    hint: b("比较 $\\lambda=np=5$ 与 $p=0.005$，回顾 Poisson 近似的适用条件。", "Compare $\\lambda=np=5$ with $p=0.005$, and recall when the Poisson approximation works."),
    solution: b("$np=5$ 且 $p=0.005$ 很小，稀有成功事件的计数用 Poisson(5) 通常更自然。正态近似没有考虑偏斜和离散性时会更差；$n$ 大并不保证任何近似都准确。", "Here $np=5$ and $p=0.005$ is small, so Poisson(5) is usually a more natural approximation for a count of rare successes. A normal approximation can be worse if it ignores skewness and discreteness; large $n$ alone does not guarantee accuracy."),
  },
];

export function exercisesForConcept(slug: string): Exercise[] {
  return exercises.filter((e) => e.concept === slug);
}

export function getExercise(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}

/** Check an answer string against an exercise. */
export function checkAnswer(exercise: Exercise, answer: string): boolean {
  if (exercise.kind === "numeric") {
    const value = parseNumeric(answer);
    if (value === null) return false;
    return Math.abs(value - exercise.answer) <= exercise.tolerance;
  }
  return Number(answer) === exercise.correct;
}

/** Why an answer is wrong (or, for a choice, why the chosen option is right), for the coach-style feedback. */
export type Diagnosis =
  | { kind: "note"; note: Bilingual }
  | { kind: "unreadable" }
  | { kind: "sign" }
  | { kind: "reciprocal" }
  | { kind: "scale"; factor: number }
  | { kind: "near"; tolerance: number };

/** Answers whose value matches a known mistake to within 5% (users round). */
const matches = (v: number, target: number, tolerance: number) => Math.abs(v - target) <= Math.max(tolerance, 0.05 * Math.abs(target));

export function diagnose(exercise: Exercise, answer: string): Diagnosis | null {
  if (exercise.kind === "choice") {
    const note = optionFeedback[exercise.id]?.[Number(answer)];
    return note ? { kind: "note", note } : null;
  }
  const v = parseNumeric(answer);
  if (v === null) return { kind: "unreadable" };
  const a = exercise.answer;
  const tol = exercise.tolerance;
  if (Math.abs(v - a) <= tol) return null;
  for (const m of numericMistakes[exercise.id] ?? []) {
    if (matches(v, m.value, tol)) return { kind: "note", note: m.feedback };
  }
  if (a !== 0 && Math.abs(v + a) <= Math.max(tol, 1e-9)) return { kind: "sign" };
  if (a !== 0 && v !== 0 && Math.abs(1 / a) !== Math.abs(a) && Math.abs(v - 1 / a) <= Math.max(tol, 1e-3 * Math.abs(1 / a))) return { kind: "reciprocal" };
  if (a !== 0) {
    for (const factor of [100, 10, 1000, 0.1, 0.01, 0.001]) {
      // Allow for rounding: 1/6 written as 16.7 (%) should still be recognised.
      if (Math.abs(v - factor * a) <= factor * Math.max(tol, 0.005 * Math.abs(a))) return { kind: "scale", factor };
    }
  }
  if (Math.abs(v - a) <= 20 * tol) return { kind: "near", tolerance: tol };
  return null;
}

/** Accepts decimals and simple fractions such as "1/3" or "-1/6". */
export function parseNumeric(input: string): number | null {
  const s = input.trim().replace(/，/g, ",");
  if (!s) return null;
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
