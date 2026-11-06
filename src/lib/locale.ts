import "server-only";

import { DEFAULT_LOCALE, getLocale, setLocale, type Locale } from "@/lib/i18n";
import { loadSettings } from "@/lib/settings-data";

/**
 * The language in effect: the one chosen in Settings → Language, or the
 * server's own (DOSSIER_LOCALE, English when it isn't set).
 */
export async function loadLocale(): Promise<Locale> {
  return (await loadSettings()).locale ?? DEFAULT_LOCALE;
}

/**
 * Makes the server speak that language for what it does next. Dossier has one
 * user, so the language is the server's: call this where work starts (a page,
 * an action, a route, a job) and the words of that work come out in it.
 *
 * It never fails the work it comes before: with the database out of reach the
 * language stays as it was, and the work itself reports the real problem.
 */
export async function applyLocale(): Promise<Locale> {
  try {
    const locale = await loadLocale();
    setLocale(locale);
    return locale;
  } catch {
    return getLocale();
  }
}
