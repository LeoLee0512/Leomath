declare namespace App {
  interface Locals {
    /** The signed-in user for this request (set by src/middleware.ts), or null. */
    user: import("./lib/auth").User | null;
    /** The page's language, from the first path segment. */
    locale: import("./i18n/config").Locale;
  }
}
