"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";
import { t } from "@/lib/i18n";

export default function AgentError(props: ErrorPageProps) {
  return <ScreenError {...props} title={t("The job agent didn't load")} />;
}
