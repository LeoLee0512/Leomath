import type { Bilingual } from "./graph";

export interface SoftwareRelease {
  version: string;
  date: string;
  platforms: string[];
  /** Direct download page. Binaries live on GitHub Releases. */
  downloadUrl: string;
}

export interface Software {
  slug: string;
  name: string;
  tagline: Bilingual;
  description: Bilingual;
  status: "preview" | "stable";
  repoUrl: string;
  releasesUrl: string;
  latest: SoftwareRelease;
}

// Binaries and release notes are hosted on GitHub Releases; LeoMath only
// provides the product page and the download entry point.
export const software: Software[] = [
  {
    slug: "leo-ai",
    name: "Leo AI",
    tagline: {
      zh: "科学研究与数学工作流工具。",
      en: "A tool for scientific research and mathematical workflows.",
    },
    description: {
      zh: "把文献整理、公式推导、数值计算和记录放进同一个工作流。目前处于预览阶段，功能与界面都会持续变化。",
      en: "Bring literature notes, symbolic derivation, numerical computation and record-keeping into one workflow. Currently in preview; features and interface will keep changing.",
    },
    status: "preview",
    repoUrl: "https://github.com/LeoLee0512/leo-ai",
    releasesUrl: "https://github.com/LeoLee0512/leo-ai/releases",
    latest: {
      version: "0.1.0-preview",
      date: "2026-09",
      platforms: ["Windows"],
      downloadUrl: "https://github.com/LeoLee0512/leo-ai/releases/latest",
    },
  },
];

export function getSoftware(slug: string): Software | undefined {
  return software.find((s) => s.slug === slug);
}
