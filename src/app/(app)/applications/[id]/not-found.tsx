import Link from "next/link";

import { ScreenMessage } from "@/components/screen-message";
import { buttonClassName } from "@/components/ui/button";
import { t } from "@/lib/i18n";

/** An application id that doesn't exist, e.g. one that was deleted (E11-4). */
export default function ApplicationNotFound() {
  return (
    <ScreenMessage
      title={t("We couldn't find that application")}
      actions={
        <Link href="/applications" className={buttonClassName("primary", "md", "hover:text-on-primary")}>
          {t("Back to Applications")}
        </Link>
      }
    >
      <p>{t("It may have been deleted, or the link is incomplete. Your other applications are all still there.")}</p>
    </ScreenMessage>
  );
}
