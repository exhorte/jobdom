import { ScreenSkeleton } from "@/components/screen-skeleton";
import { t } from "@/lib/i18n";

export default function ApplicationLoading() {
  return <ScreenSkeleton label={t("Loading the application…")} variant="document" />;
}
