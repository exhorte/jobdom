import { ScreenSkeleton } from "@/components/screen-skeleton";
import { t } from "@/lib/i18n";

export default function SettingsLoading() {
  return <ScreenSkeleton label={t("Loading settings…")} variant="form" />;
}
