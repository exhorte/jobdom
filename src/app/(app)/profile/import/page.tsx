import type { Metadata } from "next";

import { isAiConfigured, loadAiConfig } from "@/lib/ai/config";
import { t } from "@/lib/i18n";
import { jobRetentionLabel } from "@/lib/settings";
import { loadSettings } from "@/lib/settings-data";

import { ProfileImport } from "./profile-import";
import { applyLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return { title: t("Import from a resume") };
}

/** Starts the profile from an existing resume file (E4-10, PRO-12); `?job=` follows a reading in progress. */
export default async function ProfileImportPage({ searchParams }: PageProps<"/profile/import">) {
  const [{ job }, aiReady, ai, settings] = await Promise.all([searchParams, isAiConfigured(), loadAiConfig(), loadSettings()]);
  return (
    <ProfileImport
      aiReady={aiReady}
      provider={ai.provider}
      initialJobId={typeof job === "string" ? job : null}
      keptFor={jobRetentionLabel(settings.jobRetentionHours)}
    />
  );
}
