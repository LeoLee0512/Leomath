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
  /** coming-soon: shown, but not yet downloadable. */
  status: "coming-soon" | "preview" | "stable";
  /** Closed-source products have no public repository. */
  repoUrl?: string;
  /** Public releases page; absent while the product is coming soon. */
  releasesUrl?: string;
  /** Optional screenshot under /public. */
  screenshot?: string;
  /** Latest release; absent while the product is coming soon. */
  latest?: SoftwareRelease;
  /** Version to announce while coming soon. */
  upcomingVersion?: string;
}

// Leo AI is closed source. Its source repository is private. Public download
// (a releases page with binaries and notes) is not open yet: status "coming-soon".
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
    status: "coming-soon",
    upcomingVersion: "2.1.2",
  },
];

export function getSoftware(slug: string): Software | undefined {
  return software.find((s) => s.slug === slug);
}
