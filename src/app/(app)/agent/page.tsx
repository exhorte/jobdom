import type { Metadata } from "next";

import { loadAgentView } from "@/lib/agent/view";
import { t } from "@/lib/i18n";

import { AgentScreen } from "./agent-screen";
import { applyLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return { title: t("Job agent") };
}

/** The job agent (E16-6): what it found and the drafts it prepared, waiting for a look. */
export default async function AgentPage() {
  return <AgentScreen view={await loadAgentView()} />;
}
