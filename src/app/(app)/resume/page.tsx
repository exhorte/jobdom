import type { Metadata } from "next";

import { t } from "@/lib/i18n";
import { loadProfile } from "@/lib/profile-data";
import { maxPages } from "@/lib/settings";
import { loadSettings } from "@/lib/settings-data";
import { loadThemes, loadThemeUsage } from "@/lib/theme-data";

import { ResumeWorkspace } from "./resume-workspace";
import { applyLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return { title: t("Base resume") };
}

/** The base resume: a live preview of the profile in the chosen theme (RES-1). */
export default async function BaseResumePage() {
  const [profile, themes, settings, usage] = await Promise.all([loadProfile(), loadThemes(), loadSettings(), loadThemeUsage()]);
  return (
    <ResumeWorkspace
      profile={profile}
      themes={themes}
      usage={usage}
      baseThemeId={settings.baseThemeId}
      paper={settings.paper}
      includeReferences={settings.includeRefs}
      language={settings.resumeLanguage}
      maxPages={maxPages(settings.pageLimit)}
    />
  );
}
