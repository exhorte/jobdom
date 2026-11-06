import { ScreenSkeleton } from "@/components/screen-skeleton";
import { t } from "@/lib/i18n";

export default function ProfileLoading() {
  return <ScreenSkeleton label={t("Loading your profile…")} variant="form" />;
}
