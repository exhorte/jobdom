import { ScreenSkeleton } from "@/components/screen-skeleton";
import { t } from "@/lib/i18n";

export default function JobsLoading() {
  return <ScreenSkeleton label={t("Looking for postings…")} variant="list" />;
}
