import { ScreenSkeleton } from "@/components/screen-skeleton";
import { t } from "@/lib/i18n";

export default function ResumeLoading() {
  return <ScreenSkeleton label={t("Loading your base resume…")} variant="document" />;
}
