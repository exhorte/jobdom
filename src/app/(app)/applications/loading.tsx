import { ScreenSkeleton } from "@/components/screen-skeleton";
import { t } from "@/lib/i18n";

export default function ApplicationsLoading() {
  return <ScreenSkeleton label={t("Loading your applications…")} variant="list" />;
}
