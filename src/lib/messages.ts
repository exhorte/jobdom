import { tx } from "@/lib/i18n";

/**
 * User-facing messages shared by Server Actions, route handlers and the pages
 * calling them. Translate each with `t` where it is shown.
 */
export const messages = {
  signedOut: tx("You've been signed out. Sign in again to continue."),
  invalidInput: tx("Some details aren't valid. Check the highlighted fields."),
  unexpected: tx("Something went wrong on the server. Please try again."),
  crossOrigin: tx("This request didn't come from Dossier's own pages, so it was blocked."),
  offline: tx("Couldn't reach Dossier. Check your connection and try again."),
} as const;
