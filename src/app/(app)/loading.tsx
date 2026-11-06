import { ScreenSkeleton } from "@/components/screen-skeleton";
import { t } from "@/lib/i18n";

export default function DashboardLoading() {
  return <ScreenSkeleton label={t("Loading your dashboard…")} variant="dashboard" />;
}
