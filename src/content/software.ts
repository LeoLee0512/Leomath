import type { Bilingual } from "./graph";

export interface SoftwareRelease {
  version: string;
  /** ISO date of the release. */
  date: string;
  platforms: string[];
  /** Direct download page. Binaries live on a public GitHub Releases repository. */
  downloadUrl: string;
  /** SHA-256 of the installer, shown on the detail page only. */
  sha256?: string;
}

export type SoftwareStatus = "coming-soon" | "beta" | "preview" | "stable";

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
  /** Public source repository; absent for closed-source products. */
  repoUrl?: string;
  /** Public releases page. */
  releasesUrl?: string;
  /** Where a web product runs. */
  useUrl?: string;
  /** Optional screenshot under /public. */
  screenshot?: string;
  /** Latest downloadable release; absent while nothing is downloadable. */
  latest?: SoftwareRelease;
}

// Ordered as shown on the site. Leo Tree and MathForge run on the same Aliyun host
// as LeoMath (see deploy/DEPLOYMENT.md for the port layout).
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
      zh: "Leo Tree 是本机优先的个人知识结构系统：园子里种知识树，树分区，区里长节点；每个节点记录理解、学习状态（未学 / 在学 / 掌握）、实践与回顾。知识保存在你的浏览器里，可导出 JSON 或带附件的完整备份。1.0.0-beta.3 支持节点笔记中的 LaTeX 公式。Windows 版即将开放。",
      en: "Leo Tree is a local-first personal knowledge-structure system: a garden holds knowledge trees, trees have sections, sections grow nodes; each node records understanding, a learning state (not started / learning / mastered), practice and review. Knowledge stays in your browser and can be exported as JSON or a full backup with attachments. 1.0.0-beta.3 renders LaTeX in node notes. A Windows build is coming.",
    },
    useUrl: "https://8.130.33.10/",
    repoUrl: "https://github.com/LeoLee0512/leotree",
  },
  {
    slug: "mathforge",
    name: "MathForge",
    kind: "web",
    status: "stable",
    version: "0.3.1",
    tagline: {
      zh: "LeoMath 的前身：以理解为中心的开源数学学习平台。",
      en: "LeoMath's predecessor: an open-source mathematics learning platform centred on understanding.",
    },
    description: {
      zh: "MathForge 0.3「Open Learning Core」围绕 理解 → 可视化 → 练习 → 贡献 一条闭环，保留导数、Riemann 和、线性变换、Taylor、ODE 等交互实验和公式工具。它是一个纯静态单页应用，代码 MIT、内容 CC BY-SA。LeoMath 继承了它的教学方法并重新从零构建；MathForge 进入维护模式。",
      en: "MathForge 0.3 “Open Learning Core” is built around Understand → Visualize → Practice → Contribute, with interactive experiments (derivative, Riemann sums, linear transformation, Taylor, ODE) and formula tools. It is a static single-page app, MIT code and CC BY-SA content. LeoMath inherits its teaching method and was rebuilt from scratch; MathForge is now in maintenance mode.",
    },
    useUrl: "http://8.130.33.10:8090/",
    repoUrl: "https://github.com/LeoLee0512/MathLearn",
  },
  {
    slug: "leo-ai",
    name: "Leo AI",
    kind: "desktop",
    status: "coming-soon",
    version: "2.1.2",
    tagline: {
      zh: "科学研究与数学工作流工具。",
      en: "A tool for scientific research and mathematical workflows.",
    },
    description: {
      zh: "把文献整理、公式推导、数值计算和记录放进同一个工作流。闭源软件，公开下载尚未开放。",
      en: "Bring literature notes, symbolic derivation, numerical computation and record-keeping into one workflow. Closed source; public download is not open yet.",
    },
  },
];

export function getSoftware(slug: string): Software | undefined {
  return software.find((s) => s.slug === slug);
}
