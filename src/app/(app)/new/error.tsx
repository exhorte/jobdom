"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";
import { t } from "@/lib/i18n";

export default function NewApplicationError(props: ErrorPageProps) {
  return (
    <ScreenError {...props} title={t("New application didn't load")}>
      <p>{t("A posting you pasted is still kept in this tab, so it'll be there when this works again.")}</p>
    </ScreenError>
  );
}
