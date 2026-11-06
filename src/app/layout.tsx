import type { Metadata } from "next";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { Toaster } from "@/components/toast";
import { fontVariables } from "@/fonts";
import { t } from "@/lib/i18n";
import { LocaleSync } from "@/lib/i18n/locale-sync";
import { applyLocale } from "@/lib/locale";
import { COLOR_SCHEME_COOKIE, parseColorScheme } from "@/lib/ui-preferences";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return {
    title: { default: "Dossier", template: "%s · Dossier" },
    description: t("Your job search, on your server."),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Every page renders per request: its scripts carry that request's CSP nonce (E11-5).
  await connection();
  // Settings → Language, or the server's own (DOSSIER_LOCALE).
  const locale = await applyLocale();
  // Light or dark as chosen in the sidebar; without a choice, the system's.
  const scheme = parseColorScheme((await cookies()).get(COLOR_SCHEME_COOKIE)?.value);
  return (
    <html lang={locale} data-theme={scheme} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">
        {/* First, so the components after it know the language. */}
        <LocaleSync locale={locale} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
