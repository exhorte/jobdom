import { ScreenSkeleton } from "@/components/screen-skeleton";
import { t } from "@/lib/i18n";

export default function NewApplicationLoading() {
  return <ScreenSkeleton label={t("Loading…")} variant="form" />;
}
