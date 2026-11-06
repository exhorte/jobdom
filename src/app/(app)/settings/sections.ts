import { tx } from "@/lib/i18n";

/** The settings sections, in order (PRD §6.8). */
export const SETTINGS_SECTIONS = [
  { id: "ai", label: tx("AI provider") },
  { id: "jobs", label: tx("Job search") },
  { id: "agent", label: tx("Job agent") },
  { id: "documents", label: tx("Documents") },
  { id: "language", label: tx("Language") },
  { id: "google", label: "Google" },
  { id: "claude", label: tx("Claude connector") },
  { id: "data", label: tx("Your data") },
  { id: "about", label: tx("About") },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

/** The section in `?section=`, or AI provider when it's missing or unknown. */
export function settingsSectionFromParam(value: string | string[] | undefined): SettingsSectionId {
  return SETTINGS_SECTIONS.find((section) => section.id === value)?.id ?? "ai";
}

export const settingsSectionHref = (id: SettingsSectionId) => `/settings?section=${id}`;
