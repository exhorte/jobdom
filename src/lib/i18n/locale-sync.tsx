"use client";

import { setLocale, type Locale } from "./index";

/**
 * Tells the browser the server's language before the components after it
 * render (the first thing in <body>). It sets a module's variable while
 * rendering, which is safe: the value never changes during a page's life.
 */
export function LocaleSync({ locale }: { locale: Locale }): null {
  setLocale(locale);
  return null;
}
