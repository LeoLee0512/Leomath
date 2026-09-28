import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { MB } from "@/components/Math";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? getDictionary(locale).about.title : "About" };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <div className="container py-14">
      <h1 className="display text-4xl font-semibold">{t.about.title}</h1>
      <div className="prose-math mt-8">
        {locale === "zh" ? (
          <>
            <p>GitHub 解决代码托管，博客解决文章阅读，视频解决讲授。LeoMath 想做的是它们之间缺失的一层：<strong>数学知识之间的结构关系，以及数学的可操作性</strong>。</p>
            <p>学线性代数，不只是看到矩阵乘法公式，而是能亲手操作线性变换；学微分方程，不只是看到解析解，而是能改变初值、参数和步长，直接观察解怎么变化。</p>
            <MB>{"\\text{知识结构}\\rightarrow\\text{原理与推导}\\rightarrow\\text{交互实验}\\rightarrow\\text{练习}\\rightarrow\\text{计算工具}"}</MB>
            <p>每一个知识点都从定义出发，经过推导与证明，配有浏览器内实时计算的实验和检验理解的练习。直觉和严格性两边都要：直觉让你看见结论，推导与证明让你确信它为什么成立。</p>
            <h2>v0.1.0</h2>
            <p>第一版刻意很小：三条完整路线（微积分基础、线性代数基础、微分方程入门）、三个交互实验（线性变换、ODE 数值解、指数函数的导数）、一个软件页。功能很少，但产品人格已经完整。</p>
            <h2>关于作者</h2>
            <p>Leo 在学习数学、做数值计算和开发工具。这个站点是一个长期项目：学到的数学、写的计算程序和做的软件，会逐渐沉淀进来。</p>
            <h2>许可与源码</h2>
            <p>数学正文内容采用 CC BY-SA 4.0，代码采用 MIT。源代码托管在 <a href="https://github.com/LeoLee0512/Leomath">GitHub</a>。发现数学错误或表述问题，欢迎提 Issue。</p>
          </>
        ) : (
          <>
            <p>GitHub solves code hosting, blogs solve reading, videos solve lecturing. LeoMath is about the layer missing between them: <strong>the structural relations between mathematical ideas, and the ability to operate on mathematics directly</strong>.</p>
            <p>Learning linear algebra should not stop at the formula for matrix multiplication; you should be able to manipulate a linear transformation. Learning differential equations should not stop at a closed-form solution; you should be able to change initial values, parameters and step sizes and watch the solution respond.</p>
            <MB>{"\\text{Structure}\\rightarrow\\text{Principles \\& derivation}\\rightarrow\\text{Experiments}\\rightarrow\\text{Exercises}\\rightarrow\\text{Tools}"}</MB>
            <p>Every concept starts from a definition, proceeds through derivation and proof, and comes with experiments computed live in the browser and exercises that test understanding. Both intuition and rigour: intuition lets you see the result; derivation and proof let you know why it holds.</p>
            <h2>v0.1.0</h2>
            <p>The first release is deliberately small: three complete paths (calculus, linear algebra, differential equations), three interactive experiments (linear transformation, numerical ODE, the derivative of the exponential), one software page. Few features, but a complete character.</p>
            <h2>About the author</h2>
            <p>Leo studies mathematics, does numerical computation and builds tools. This site is a long-term project: the mathematics learned, the programs written and the software built will accumulate here.</p>
            <h2>Licence and source</h2>
            <p>Mathematical content is CC BY-SA 4.0; code is MIT. Source is on <a href="https://github.com/LeoLee0512/Leomath">GitHub</a>. Issues for mathematical errors or unclear exposition are welcome.</p>
          </>
        )}
      </div>
    </div>
  );
}
