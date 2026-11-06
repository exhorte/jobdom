"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";
import { t } from "@/lib/i18n";

export default function SettingsError(props: ErrorPageProps) {
  return <ScreenError {...props} title={t("Settings didn't load")} />;
}
