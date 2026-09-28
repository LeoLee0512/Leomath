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

export interface Software {
  slug: string;
  name: string;
  tagline: Bilingual;
  description: Bilingual;
  status: "preview" | "stable";
  /** Closed-source products have no public repository. */
  repoUrl?: string;
  releasesUrl: string;
  /** Optional screenshot under /public. */
  screenshot?: string;
  latest: SoftwareRelease;
}

// Leo AI is closed source. Its source repository is private; only binaries and
// release notes are published, through a public releases repository.
export const software: Software[] = [
  {
    slug: "leo-ai",
    name: "Leo AI",
    tagline: {
      zh: "科学研究与数学工作流工具。",
      en: "A tool for scientific research and mathematical workflows.",
    },
    description: {
      zh: "把文献整理、公式推导、数值计算和记录放进同一个工作流。闭源软件，二进制与更新说明通过 GitHub Releases 发布。",
      en: "Bring literature notes, symbolic derivation, numerical computation and record-keeping into one workflow. Closed source; binaries and release notes are published through GitHub Releases.",
    },
    status: "stable",
    releasesUrl: "https://github.com/LeoLee0512/leo-ai-releases/releases",
    latest: {
      version: "2.1.2",
      date: "2026-09",
      platforms: ["Windows x64"],
      downloadUrl: "https://github.com/LeoLee0512/leo-ai-releases/releases/latest",
    },
  },
];

export function getSoftware(slug: string): Software | undefined {
  return software.find((s) => s.slug === slug);
}
