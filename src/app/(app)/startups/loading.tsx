import { ScreenSkeleton } from "@/components/screen-skeleton";
import { t } from "@/lib/i18n";

export default function StartupsLoading() {
  return <ScreenSkeleton label={t("Loading startups…")} variant="list" />;
}
