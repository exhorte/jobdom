"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";
import { t } from "@/lib/i18n";

/** When a screen in the app fails to load (E11-4); the sidebar stays. */
export default function AppError(props: ErrorPageProps) {
  return <ScreenError {...props} title={t("This screen didn't load")} elsewhere={{ href: "/applications", label: "Open your applications" }} />;
}
