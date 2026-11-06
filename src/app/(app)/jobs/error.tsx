"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";
import { t } from "@/lib/i18n";

export default function JobsError(props: ErrorPageProps) {
  return <ScreenError {...props} title={t("Find jobs didn't load")} />;
}
