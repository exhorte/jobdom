"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";
import { t } from "@/lib/i18n";

export default function ProfileError(props: ErrorPageProps) {
  return <ScreenError {...props} title={t("Your profile didn't load")} />;
}
