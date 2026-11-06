import type { Metadata } from "next";

import { t } from "@/lib/i18n";
import { loadProfile } from "@/lib/profile-data";
import { loadSettings } from "@/lib/settings-data";

import { ProfileEditor } from "./profile-editor";
import { sectionFromParam } from "./sections";
import { applyLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return { title: t("Profile") };
}

/** The profile editor; the current section is in `?section=` (E4-1). */
export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const [{ section }, profile, settings] = await Promise.all([searchParams, loadProfile(), loadSettings()]);
  return (
    <ProfileEditor
      initial={profile}
      section={sectionFromParam(section)}
      order={{ experience: settings.experienceOrder, projects: settings.projectOrder, education: settings.educationOrder }}
    />
  );
}
