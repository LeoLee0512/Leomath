import type { Dictionary } from "@/i18n/dictionaries";
import type { Software } from "@/content/software";

export function statusLabel(s: Software, t: Dictionary["software"]): string {
  switch (s.status) {
    case "coming-soon": return t.statusComing;
    case "beta": return t.statusBeta;
    case "archived": return t.statusArchived;
    case "preview": return t.statusPreview;
    default: return t.statusStable;
  }
}
