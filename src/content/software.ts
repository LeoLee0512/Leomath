import type { Bilingual } from "./graph";

export interface SoftwareRelease {
  version: string;
  /** ISO date of the release. */
  date: string;
  platforms: string[];
  /** Direct download URL of the installer. */
  downloadUrl: string;
  /** SHA-256 of the installer, shown on the detail page only. */
  sha256?: string;
}

export type SoftwareStatus = "coming-soon" | "beta" | "preview" | "stable" | "archived";

export interface Software {
  slug: string;
  name: string;
  tagline: Bilingual;
  description: Bilingual;
  /** web: used in the browser (button “Open”); desktop: downloaded and installed. */
  kind: "web" | "desktop";
  status: SoftwareStatus;
  /** Current version, shown even when nothing is downloadable. */
  version?: string;
  /** Shown as “open source” on the card and detail page. No repository links are published on the site. */
  openSource?: boolean;
  /** Where a web product runs. */
  useUrl?: string;
  /** Optional screenshot under /public. */
  screenshot?: string;
  /** Latest downloadable release; absent while nothing is downloadable. */
  latest?: SoftwareRelease;
}

// Ordered as shown on the site. Leo Tree is deployed with Docker on the same Aliyun host
// as LeoMath, behind tree.leomath.cn (see deploy/DEPLOYMENT.md and the leotree repo).
export const software: Software[] = [
  {
    slug: "leo-tree",
    name: "Leo Tree",
    kind: "web",
    status: "beta",
    version: "1.0.0-beta.3",
    tagline: {
      zh: "把一个领域整理成可以拆解、学习、回顾、修整的知识树。",
      en: "Turn a field of knowledge into a tree you can decompose, learn, revisit and prune.",
    },
    description: {
      zh: "Leo Tree 是本机优先的个人知识结构系统：园子里种知识树，树分区，区里长节点；每个节点记录理解、学习状态（未学 / 在学 / 掌握）、实践与回顾。知识保存在你的浏览器里，可导出 JSON 或带附件的完整备份。1.0.0-beta.3 支持节点笔记中的 LaTeX 公式。网页版正在迁移到新地址，暂未开放；Windows 版即将开放。",
      en: "Leo Tree is a local-first personal knowledge-structure system: a garden holds knowledge trees, trees have sections, sections grow nodes; each node records understanding, a learning state (not started / learning / mastered), practice and review. Knowledge stays in your browser and can be exported as JSON or a full backup with attachments. 1.0.0-beta.3 renders LaTeX in node notes. The web version is moving to a new address and is not open yet; a Windows build is coming.",
    },
    // No public URL yet: the bare-IP deployment was retired when the server was rebuilt (2026-09-28).
    // Once the Docker deployment at https://tree.leomath.cn/ is live, set useUrl to it (never an IP).
    openSource: true,
  },
  {
    slug: "computational-mechanics-solver",
    name: "Computational Mechanics Solver",
    kind: "web",
    status: "stable",
    version: "1.5.1",
    tagline: {
      zh: "带浏览器建模界面的二维静力学与动力学求解器。",
      en: "A 2D statics and dynamics solver with a browser modelling interface.",
    },
    description: {
      zh: "静力学：二维梁柱、桁架与刚性单元，节点与分布荷载，铰接释放，位移、反力、内力图、体系判断与 PDF 计算书。动力学：质点与刚体、碰撞与摩擦、约束轨道、随时间与空间变化的力场，数值核心在浏览器中运行。Python 服务端负责账户、静力学求解与报告；代码 MIT。v1.5.1 起所有账户拥有相同能力，没有套餐或会员。",
      en: "Statics: 2D beams, trusses and rigid elements, nodal and distributed loads, hinge releases, displacements, reactions, internal-force diagrams, system classification and PDF reports. Dynamics: particles and rigid bodies, collisions and friction, constraint tracks, force fields varying in time and space, with the numerical core running in the browser. A Python server handles accounts, static solving and reports; MIT licensed. Since v1.5.1 every account has the same capabilities; there are no plans or memberships.",
    },
    openSource: true,
  },
  {
    slug: "mathforge",
    name: "MathForge",
    kind: "web",
    status: "archived",
    version: "0.3.1",
    tagline: {
      zh: "LeoMath 的前身：以理解为中心的开源数学学习平台。已归档。",
      en: "LeoMath's predecessor: an open-source mathematics learning platform centred on understanding. Archived.",
    },
    description: {
      zh: "MathForge 0.3「Open Learning Core」围绕 理解 → 可视化 → 练习 → 贡献 一条闭环。它的教学方法、交互实验（割线与切线、Riemann 和、Taylor 逼近、线性变换、方向场）和工具（公式编辑器、函数绘图、计算器）已经在 LeoMath 中重写；其余内容（概率、数论、解析几何的学习单元，《几何原本》语料）随项目一起归档，代码 MIT、内容 CC BY-SA。",
      en: "MathForge 0.3 “Open Learning Core” was built around Understand → Visualize → Practice → Contribute. Its teaching method, experiments (secant and tangent, Riemann sums, Taylor approximation, linear transformation, direction fields) and tools (formula editor, plotter, calculator) have been rewritten inside LeoMath; the rest (probability, number theory and analytic geometry units, the Euclid corpus) is archived with the project, MIT code and CC BY-SA content.",
    },
    openSource: true,
  },
  {
    slug: "leo-ai",
    name: "Leo AI",
    kind: "desktop",
    status: "coming-soon",
    version: "2.1.2",
    tagline: {
      zh: "面向学习、研究与创作的 Windows 桌面 AI 工作台。",
      en: "A Windows desktop AI workbench for learning, research and creation.",
    },
    description: {
      zh: "在一个工作台里阅读文献、整理论证、跑计算、写成果。可接入 DeepSeek、OpenAI、Anthropic、Gemini、Moonshot、智谱、通义、火山等模型或本机 llama.cpp 模型，密钥只存本机；内置笔记本与计算环境（WSL2）、Lean 4 + Mathlib 证明检查、带页码引用的本地文献检索，以及文献 → 建模 → 数值实验 → 验证 → 写作的五角色科研流程；可导出到 Leo Tree。另含物理信息神经网络（PINN）闭环科研模块，其科学结论仍在验收中。闭源软件，公开下载尚未开放。",
      en: "Read the literature, organise arguments, run computations and write up results in one workbench. Connects to DeepSeek, OpenAI, Anthropic, Gemini, Moonshot, Zhipu, Qwen, Volcano and other providers or to a local llama.cpp model, with keys kept on your machine; includes a notebook and computation environment (WSL2), Lean 4 + Mathlib proof checking, local literature search with page citations, and a five-role research pipeline (survey → model → numerical experiment → validate → write); exports to Leo Tree. A physics-informed neural network (PINN) closed-loop research module is included, with its scientific results still under review. Closed source; public download is not open yet.",
    },
  },
];

export function getSoftware(slug: string): Software | undefined {
  return software.find((s) => s.slug === slug);
}
