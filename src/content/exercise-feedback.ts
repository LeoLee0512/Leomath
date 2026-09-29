import type { Bilingual } from "./graph";

const b = (zh: string, en: string): Bilingual => ({ zh, en });

/**
 * Coaching for multiple-choice exercises: one note per option, in option order.
 * A wrong option's note names the misconception that leads to it; the correct one's says why it holds.
 * tests/graph.test.ts checks that every choice exercise has exactly one note per option.
 */
export const optionFeedback: Record<string, Bilingual[]> = {
  "limit-2": [
    b("δ=ε 只能保证 |f(x)−3|=2|x−1|<2ε，差了一倍。δ 要把系数 2 吸收掉。", "δ=ε only gives |f(x)−3|=2|x−1|<2ε, twice too large. δ has to absorb the factor 2."),
    b("|f(x)−3|=2|x−1|<2δ=ε：系数 2 正好被 δ=ε/2 抵消。", "|f(x)−3|=2|x−1|<2δ=ε: the factor 2 is exactly cancelled by δ=ε/2."),
    b("方向反了：更大的 δ 让 x 离 1 更远，只能保证 |f(x)−3|<4ε。", "Wrong direction: a larger δ lets x move further from 1 and only gives |f(x)−3|<4ε."),
    b("ε≤1/2 时 ε²≤ε/2 确实可行，但 ε=1 时 δ=1 只给出 |f(x)−3|<2。“一定可行”要求对每个 ε 都成立。", "For ε≤1/2, ε²≤ε/2 does work, but at ε=1 the choice δ=1 only gives |f(x)−3|<2. “Always works” means for every ε."),
  ],
  "mean-value-theorem-2": [
    b("|x| 在 [−1,1] 上处处连续，这个条件满足。", "|x| is continuous on all of [−1,1]; this hypothesis holds."),
    b("|x| 在 x=0 有尖点：左导数 −1，右导数 1，不可导。定理恰好断在这里。", "|x| has a corner at 0: left derivative −1, right derivative 1, not differentiable. That is exactly where the theorem breaks."),
    b("端点值 |−1|=|1|，是相等的；而且 Lagrange 中值定理本来就不要求端点值相等，那是 Rolle 定理的条件。", "The endpoint values are equal; besides, the Lagrange mean value theorem does not need equal endpoints at all. That is Rolle's hypothesis."),
    b("[−1,1] 是有界闭区间，满足；定理本来就在有界闭区间上陈述。", "[−1,1] is a closed bounded interval, so this holds; the theorem is stated on such intervals anyway."),
  ],
  "integral-2": [
    b("微积分基本定理：被积函数连续时，F′(x) 就是被积函数在上限 x 处的值。", "The fundamental theorem: with a continuous integrand, F′(x) is the integrand evaluated at the upper limit x."),
    b("这是把 e^{−x²} 又求了一次导。要求导的是积分上限函数 F，不是被积函数。", "This differentiates e^{−x²} once more. The thing to differentiate is F, the integral, not the integrand."),
    b("求导和积分弄反了：F 本身才是积分，F′ 应当把积分“拆掉”。", "Derivative and integral are swapped: F is the integral; F′ undoes it."),
    b("F(x) 随上限 x 变化，不是常数；这里把 ∫₀ˣ 当成了一个固定的数。", "F(x) changes with its upper limit x; it is not a constant. ∫₀ˣ was treated as a fixed number."),
  ],
  "taylor-2": [
    b("x³ 的系数为 0，所以 1−x²/2 也是 3 阶 Taylor 多项式，余项是 4 阶的：|R|≤|x|⁴/4!≤0.5⁴/24≈0.0026。", "The x³ coefficient is 0, so 1−x²/2 is also the degree-3 Taylor polynomial and the remainder is of order 4: |R|≤|x|⁴/4!≤0.5⁴/24≈0.0026."),
    b("这是 3 阶余项 |x|³/3!≈0.0208。它是一个正确的上界，但不是最紧的：x³ 项为零，可以用 4 阶余项。", "This is the order-3 remainder |x|³/3!≈0.0208. It is a valid bound, but not the tightest: the x³ term vanishes, so the order-4 remainder applies."),
    b("0.5²/2=0.125 是保留下来的 x²/2 项本身，不是被舍去部分的大小。", "0.5²/2=0.125 is the kept term x²/2 itself, not the size of what was dropped."),
    b("0.5 只是 |x| 的上界，没有用到余项的阶数。", "0.5 is just the bound on |x|; it does not use the order of the remainder."),
  ],
  "vectors-2": [
    b("次数 ≤2 的多项式对加法、数乘封闭，也含零多项式，是向量空间。", "Polynomials of degree ≤2 are closed under addition and scaling and include zero: a vector space."),
    b("两个 2 次多项式相加可能掉阶，如 (x²+1)+(−x²)=1；零多项式也不在里面。不封闭，所以不是向量空间。", "Two degree-2 polynomials can add to a lower degree, e.g. (x²+1)+(−x²)=1, and the zero polynomial is missing. Not closed, so not a vector space."),
    b("ℝⁿ 是向量空间最标准的例子。", "ℝⁿ is the standard example of a vector space."),
    b("矩阵逐项相加、数乘，满足全部公理，是一个 4 维向量空间。", "Matrices add and scale entrywise and satisfy every axiom: a 4-dimensional vector space."),
  ],
  "inner-product-2": [
    b("C=1 不够：取 a₁=⋯=aₙ=1，左边是 n²，右边只有 n。", "C=1 is too small: with a₁=⋯=aₙ=1 the left side is n² and the right side only n."),
    b("还是全取 1：左边 n²，右边 C·n，需要 C≥n；n≥2 时 √n 太小。", "Take all aᵢ=1 again: left n², right C·n, so C≥n; for n≥2, √n is too small."),
    b("取 b=(1,…,1)：(∑aᵢ·1)²≤(∑aᵢ²)(∑1²)=n∑aᵢ²；全取 1 时等号成立，所以 n 最小。", "Take b=(1,…,1): (∑aᵢ·1)²≤(∑aᵢ²)(∑1²)=n∑aᵢ²; equality at all aᵢ=1, so n is the smallest."),
    b("n² 也成立，但不是最小的；Cauchy–Schwarz 给出更紧的 n。", "n² works too, but is not the smallest; Cauchy–Schwarz gives the tighter n."),
  ],
  "linear-maps-2": [
    b("每个分量都是 x、y 的线性组合，没有常数项和乘积项，所以保持加法和数乘。", "Each component is a linear combination of x and y, with no constant or product terms, so addition and scaling are preserved."),
    b("有常数项：f(0,0)=(1,0)≠0。线性映射一定把零向量映到零向量。", "There is a constant term: f(0,0)=(1,0)≠0. A linear map always sends zero to zero."),
    b("xy 是乘积项：f(2x,2y)=(4xy,0)≠2f(x,y)，不保持数乘。", "xy is a product: f(2x,2y)=(4xy,0)≠2f(x,y), so scaling is not preserved."),
    b("f(2x)=4x²≠2x²，不保持数乘；它的图像是抛物线，不是过原点的直线。", "f(2x)=4x²≠2x², so scaling fails; its graph is a parabola, not a line through the origin."),
  ],
  "matrices-2": [
    b("这是关于 x 轴的反射：e₁ 不动，e₂ 翻到下方。", "This is the reflection in the x-axis: e₁ stays, e₂ flips down."),
    b("这是关于直线 y=x 的反射（交换两个坐标），行列式为 −1，不可能是旋转。", "This reflects in the line y=x (swapping coordinates); its determinant is −1, so it cannot be a rotation."),
    b("矩阵的列就是基向量的像：e₁=(1,0) 转到 (0,1)，e₂=(0,1) 转到 (−1,0)。", "The columns are the images of the basis: e₁=(1,0) goes to (0,1), e₂=(0,1) to (−1,0)."),
    b("这是顺时针旋转 90°：e₁ 被送到 (0,−1)。方向反了。", "This is the clockwise rotation by 90°: e₁ goes to (0,−1). Wrong direction."),
  ],
  "eigenvalues-2": [
    b("特征值只有 λ=1（二重）。(A−I)v=0 即 v₂=0，所以特征向量只能在 (1,0) 方向。", "The only eigenvalue is λ=1 (double). (A−I)v=0 means v₂=0, so eigenvectors lie along (1,0) only."),
    b("A(0,1)=(1,1)，方向变了，所以 (0,1) 不是特征向量。", "A(0,1)=(1,1): the direction changes, so (0,1) is not an eigenvector."),
    b("只有 A 是单位阵的倍数时才会这样；剪切把 (0,1) 推歪了。", "That happens only when A is a multiple of the identity; the shear tilts (0,1)."),
    b("特征多项式 (λ−1)²=0 有实根 λ=1，所以有实特征向量。没有实特征向量的，是特征值为虚数的矩阵，比如转角不是 0° 或 180° 的旋转。", "The characteristic polynomial (λ−1)² has the real root 1, so real eigenvectors exist. Matrices without real eigenvectors are those with non-real eigenvalues, such as rotations by angles other than 0° or 180°."),
  ],
  "what-is-ode-2": [
    b("阶看方程里出现的最高阶导数，不看 y·y′ 里的一阶导数。", "The order is the highest derivative present, not the first derivative inside y·y′."),
    b("方程里没有 y″；出现的最高阶导数是 y‴。", "There is no y″ here; the highest derivative that appears is y‴."),
    b("最高阶导数是 y‴，所以是三阶；y·y′ 只是让方程变成非线性。", "The highest derivative is y‴, so the order is 3; the y·y′ term only makes the equation nonlinear."),
    b("线性与否和阶是两回事：非线性方程同样有阶。", "Linearity and order are separate questions: nonlinear equations have an order too."),
  ],
  "first-order-ode-2": [
    b("积分因子是 e^{∫2dt}=e^{2t}：乘上后左边正好是 (e^{2t}y)′。", "The integrating factor is e^{∫2dt}=e^{2t}: after multiplying, the left side is exactly (e^{2t}y)′."),
    b("e^t 是右端项；积分因子只由 y 前面的系数 2 决定。", "e^t is the right-hand side; the integrating factor depends only on the coefficient 2 of y."),
    b("符号反了：(e^{−2t}y)′=e^{−2t}(y′−2y)，对应的是 y′−2y。", "Wrong sign: (e^{−2t}y)′=e^{−2t}(y′−2y), which matches y′−2y."),
    b("乘一个常数不能把左边变成某个乘积的导数；需要的是 e^{∫p(t)dt}。", "Multiplying by a constant cannot turn the left side into the derivative of a product; you need e^{∫p(t)dt}."),
  ],
  "second-order-linear-ode-2": [
    b("那是 y″−4y=0 的解（r²−4=0）；这里是 r²+4=0，根是虚数。", "That solves y″−4y=0 (r²−4=0); here r²+4=0 has imaginary roots."),
    b("r²+4=0 ⇒ r=±2i，实形式的解是 cos2t 与 sin2t 的线性组合。", "r²+4=0 ⇒ r=±2i, whose real solutions are combinations of cos2t and sin2t."),
    b("这是重根 r=−2 的形式，对应 (r+2)²=0，也就是 y″+4y′+4y=0。", "This is the double-root form for r=−2, i.e. (r+2)²=0, the equation y″+4y′+4y=0."),
    b("角频率是 √4=2，不是 4：r²=−4 ⇒ r=±2i。", "The angular frequency is √4=2, not 4: r²=−4 ⇒ r=±2i."),
  ],
  "numerical-ode-2": [
    b("步长减半、误差减半的是一阶方法，比如 Euler 法。", "Error halving with the step is first-order behaviour, like Euler's method."),
    b("误差变为 1/4 的是二阶方法，比如中点法。", "Error dropping to 1/4 is second-order behaviour, like the midpoint method."),
    b("1/8 对应三阶方法。", "1/8 corresponds to a third-order method."),
    b("(h/2)⁴=h⁴/16：四阶方法步长减半，误差约为原来的 1/16。", "(h/2)⁴=h⁴/16: halving the step of a fourth-order method divides the error by about 16."),
  ],
  "probability-space-4": [
    b("只看你和其余 22 人这 22 对：1−(364/365)²²≈0.059。", "Only the 22 pairs involving you matter: 1−(364/365)²²≈0.059."),
    b("25% 是把“有人和你同一天”想得太容易了，大概是凭感觉在“很小”和“一半”之间取了个中间值。和你有关的只有 22 对，每对 1/365，合计约 22/365≈6%。", "25% overestimates it, probably a guess halfway between “small” and “half”. Only 22 pairs involve you, each with chance 1/365, about 22/365≈6% in all."),
    b("51% 是“任意两人同一天”的概率，那里有 253 对；这里只问和你同一天，只有 22 对。", "51% is for “some two share a day”, with 253 pairs; here only the 22 pairs with you count."),
    b("94% 是“没有人和你同一天”的概率，把补事件当成了所求事件。", "94% is the chance that nobody shares your day: the complement was taken for the event itself."),
  ],
  "conditional-probability-3": [
    b("互斥是“一个发生，另一个就不可能发生”，这是强烈的相关，不是无关。", "Exclusive means “if one happens, the other cannot”: strong dependence, not unrelatedness."),
    b("互斥给出 P(A∩B)=0，而 P(A)P(B)>0，乘积公式不成立。", "Exclusivity gives P(A∩B)=0 while P(A)P(B)>0, so the product rule fails."),
    b("在 P(A)、P(B) 都大于 0 的前提下没有例外。只有某个概率为 0 时，互斥事件才可能独立。", "With both probabilities positive there is no exception. Exclusive events can be independent only when one has probability 0."),
    b("独立与否和两个概率是否相等无关；这里 P(A∩B)=0 总不等于正数 P(A)P(B)。", "Independence has nothing to do with the two probabilities being equal; here P(A∩B)=0 never equals the positive P(A)P(B)."),
  ],
};

/** A specific wrong numeric answer and what it usually means. Checked before the generic diagnoses. */
export interface KnownMistake {
  value: number;
  feedback: Bilingual;
}

export const numericMistakes: Record<string, KnownMistake[]> = {
  "limit-1": [
    { value: 1, feedback: b("用了 sin u/u→1，但漏了系数：sin3x/x=3·(sin3x)/(3x)。", "You used sin u/u→1 but lost the factor: sin3x/x=3·(sin3x)/(3x).") },
  ],
  "derivative-1": [
    { value: 12, feedback: b("漏了 −2x 的导数 −2：f′(x)=3x²−2。", "The derivative −2 of −2x is missing: f′(x)=3x²−2.") },
    { value: 4, feedback: b("这是 f(2)=8−4，不是导数 f′(2)。", "That is f(2)=8−4, not the derivative f′(2).") },
  ],
  "integral-1": [
    { value: 0.5, feedback: b("x²/2 是 x 的原函数；x² 的原函数是 x³/3。", "x²/2 is an antiderivative of x; for x² it is x³/3.") },
    { value: 1, feedback: b("这是被积函数在上限处的值，不是曲线下的面积。", "That is the integrand at the upper limit, not the area under the curve.") },
  ],
  "mean-value-theorem-1": [
    { value: 1, feedback: b("ξ 一般不是区间中点。解 f′(ξ)=3ξ²=4。", "ξ is generally not the midpoint. Solve f′(ξ)=3ξ²=4.") },
  ],
  "probability-space-1": [
    { value: 1 / 11, feedback: b("和 2 到 12 这 11 种结果不是等可能的：和为 7 有 6 种有序对，和为 2 只有 1 种。样本空间要用有序对。", "The 11 sums 2–12 are not equally likely: 7 arises from 6 ordered pairs, 2 from only 1. Use ordered pairs as outcomes.") },
  ],
  "conditional-probability-1": [
    { value: 1 / 6, feedback: b("这是不加条件时的概率。已知和为 8，样本空间就缩小成了 5 个有序对。", "That is the unconditional probability. Given the sum is 8, the sample space shrinks to 5 ordered pairs.") },
  ],
  "conditional-probability-2": [
    { value: 0.4, feedback: b("0.4 是乙的产量占比，也就是先验，还没用上“抽到次品”这条信息。", "0.4 is B's share of production, the prior; the information “defective” has not been used yet.") },
    { value: 0.05, feedback: b("0.05 是 P(次品|乙)，所求的是反过来的 P(乙|次品)。", "0.05 is P(defective | B); the question asks for the reverse, P(B | defective).") },
    { value: 0.032, feedback: b("0.032 是 P(次品)，是 Bayes 公式的分母，还要用它去除 P(乙)P(次品|乙)。", "0.032 is P(defective), the denominator of Bayes' formula; divide P(B)P(defective | B) by it.") },
  ],
  "conditional-probability-4": [
    { value: 0.107, feedback: b("这是只测一次后的后验。第二次阳性要把 0.107 当作新的先验再更新一次。", "That is the posterior after one test. For the second positive, use 0.107 as the new prior and update again.") },
    { value: 0.9025, feedback: b("0.95²=P(两次阳性|病)，方向反了；还需要先验和误报这一项。", "0.95²=P(two positives | ill): the conditional is reversed, and the prior and false-alarm term are still missing.") },
  ],
};
