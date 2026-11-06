"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";
import { t } from "@/lib/i18n";

export default function ApplicationError(props: ErrorPageProps) {
  return <ScreenError {...props} title={t("This application didn't load")} elsewhere={{ href: "/applications", label: "Back to Applications" }} />;
}
