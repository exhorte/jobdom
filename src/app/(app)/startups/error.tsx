"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";
import { t } from "@/lib/i18n";

export default function StartupsError(props: ErrorPageProps) {
  return <ScreenError {...props} title={t("Startups didn't load")} />;
}
