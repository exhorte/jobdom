import { fr } from "./fr";

// The app's words, in English in the source and in another language on request.
// English text is the key: `t("Save changes")` is "Save changes" unless a
// catalog has it, so a missing translation shows the English, never a blank,
// and the tests (which run in English) read the source's own words.
//
// The language is the server's: DOSSIER_LOCALE ("en" or "fr", default "en").
// The root layout passes it on to the browser (LocaleSync), so a word is the
// same in the page the server renders and in the page the browser takes over.
//
// Call `t` while rendering or inside a function, never while a module loads:
// the browser learns the language only once the first component renders. A
// table of words that exists at load time marks them with `tx` and translates
// each with `t` where it shows.

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export type Values = Record<string, string | number>;

/** "fr", "fr-FR" or "FR_ca" → "fr"; anything unknown → "en". */
export function parseLocale(value: unknown): Locale {
  const language = typeof value === "string" ? value.trim().toLowerCase().split(/[-_]/)[0] : "";
  return (LOCALES as readonly string[]).includes(language ?? "") ? (language as Locale) : "en";
}

/**
 * French typesetting, applied once to the catalog so the entries can be typed
 * plainly: a no-break space before ? ! : ; % and inside « », and ’ for the
 * apostrophe between letters.
 */
function frenchTypography(text: string): string {
  return text
    .replace(/ ([?!:;%»])/g, " $1")
    .replace(/« /g, "« ")
    .replace(/(\p{L})'(\p{L})/gu, "$1’$2");
}

const catalogs: Record<Locale, Readonly<Record<string, string>>> = {
  en: {},
  fr: Object.fromEntries(Object.entries(fr).map(([english, french]) => [english, frenchTypography(french)])),
};

/** The server's own language (DOSSIER_LOCALE); what Settings → Language falls back to. */
export const DEFAULT_LOCALE: Locale = parseLocale(typeof process === "undefined" ? undefined : process.env.DOSSIER_LOCALE);

/** Each language in its own words, for the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", fr: "Français" };

// `process.env` is the server's; in the browser it's empty until LocaleSync runs.
let current: Locale = DEFAULT_LOCALE;

export function setLocale(locale: Locale): void {
  current = locale;
}

export function getLocale(): Locale {
  return current;
}

/** The tag `Intl` and `toLocale…String` take: `fallback` in English (each caller's own), "fr-FR" in French. */
export function intlLocale(fallback = "en-US"): string {
  return current === "fr" ? "fr-FR" : fallback;
}

/** "A, B and C" (English), "A, B et C" (French). */
export function listOf(names: string[]): string {
  return new Intl.ListFormat(intlLocale("en-GB"), { style: "long", type: "conjunction" }).format(names);
}

/** Fills `{name}` in a text from `values`; a name without a value stays as written. */
function fill(text: string, values?: Values): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => (name in values ? String(values[name]) : placeholder));
}

/**
 * The words in the server's language, with `{name}` filled from `values`.
 * Anything that isn't text (an element a label holds, nothing at all) passes
 * through unchanged, so a label of either kind can go through `t`.
 */
export function t(text: string, values?: Values): string;
export function t<T>(text: T): T;
export function t(text: unknown, values?: Values): unknown {
  return typeof text === "string" ? fill(catalogs[current][text] ?? text, values) : text;
}

/**
 * Marks a word for the catalog where it can't be translated yet (a table at
 * module level), and returns it as it is. Translate it with `t` where it shows.
 */
export function tx<T extends string>(text: T): T {
  return text;
}

/**
 * One of two forms by the number: `tp(n, "{count} job", "{count} jobs")`;
 * `{count}` is `n`. The catalog holds both forms in one entry, "one|other",
 * and French takes the first for 0 and 1.
 */
export function tp(count: number, one: string, other: string, values?: Values): string {
  const entry = current === "en" ? undefined : catalogs[current][`${one}|${other}`];
  let text: string;
  if (entry) {
    const [singular, plural] = entry.split("|");
    text = new Intl.PluralRules(current).select(count) === "one" ? singular! : (plural ?? singular!);
  } else {
    text = count === 1 ? one : other;
  }
  return fill(text, { count: new Intl.NumberFormat(intlLocale()).format(count), ...values });
}
