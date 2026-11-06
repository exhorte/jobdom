import { ScreenSkeleton } from "@/components/screen-skeleton";
import { t } from "@/lib/i18n";

export default function AgentLoading() {
  return <ScreenSkeleton label={t("Loading what the agent found…")} variant="list" />;
}
