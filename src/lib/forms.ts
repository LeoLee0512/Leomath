import type { AstroGlobal } from "astro";
import type { FormResult } from "@/actions";

/**
 * After a form posted to one of these actions (see src/actions): if it succeeded, redirect (303, so a reload
 * does not post again); otherwise the page renders and shows the error from Astro.getActionResult.
 */
export function redirectAfterForms(Astro: AstroGlobal, list: Parameters<AstroGlobal["getActionResult"]>[0][]): Response | undefined {
  for (const action of list) {
    const result = Astro.getActionResult(action) as { data?: FormResult } | undefined;
    if (result?.data?.ok) return Astro.redirect(result.data.redirect, 303);
  }
  return undefined;
}
