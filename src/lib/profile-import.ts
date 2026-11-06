import { z } from "zod";

import { LanguageLevel } from "@/generated/prisma/enums";
import { BASICS_FIELDS } from "@/lib/profile";
import { tp, tx } from "@/lib/i18n";

// A profile read from a resume file (E4-10, PRO-12), as the preview shows it
// and the import applies it. Anything the file's text doesn't contain is
// marked, so the preview can say "check this".

const span = {
  startYear: z.number().int().nullable(),
  startMonth: z.number().int().min(1).max(12).nullable(),
  endYear: z.number().int().nullable(),
  endMonth: z.number().int().min(1).max(12).nullable(),
  current: z.boolean(),
};
/** Words of an entry that aren't in the file, e.g. a company the model misspelled. */
const unverified = z.array(z.string());

export const importedProfileSchema = z.object({
  basics: z.partialRecord(z.enum(BASICS_FIELDS), z.string()),
  skills: z.array(z.object({ name: z.string(), found: z.boolean() })),
  languages: z.array(z.object({ name: z.string(), level: z.enum(LanguageLevel), levelGiven: z.boolean() })),
  experience: z.array(
    z.object({ role: z.string(), company: z.string(), location: z.string(), bullets: z.string(), skills: z.array(z.string()), ...span, unverified }),
  ),
  /** Absent in readings made before projects (PRO-13). */
  projects: z
    .array(z.object({ name: z.string(), link: z.string(), bullets: z.string(), skills: z.array(z.string()), ...span, unverified }))
    .default([]),
  education: z.array(z.object({ degree: z.string(), school: z.string(), notes: z.string(), ...span, unverified })),
  /** Absent in readings made before publications (#218). */
  publications: z.array(z.object({ citation: z.string(), link: z.string(), unverified })).default([]),
  references: z.array(
    z.object({ name: z.string(), relation: z.string(), company: z.string(), email: z.string(), phone: z.string(), unverified }),
  ),
});
export type ImportedProfile = z.infer<typeof importedProfileSchema>;

/** Merge into the profile (what the file says wins) or replace it (decided 29 September 2026). */
export type ImportMode = "merge" | "replace";

/** The steps of reading a resume, as the progress shows them. */
export const IMPORT_PROFILE_STEPS = [tx("Reading your resume"), tx("Sorting it into your profile")] as const;

/** "3 roles, 1 project, 12 skills…": what a preview holds, for the page and the toast. */
export function importCounts(profile: ImportedProfile): string {
  return [
    tp(profile.experience.length, "{count} role", "{count} roles"),
    tp(profile.projects.length, "{count} project", "{count} projects"),
    tp(profile.education.length, "{count} degree", "{count} degrees"),
    // Optional and rare: only said when there are some (#218).
    ...(profile.publications.length > 0 ? [tp(profile.publications.length, "{count} publication", "{count} publications")] : []),
    tp(profile.skills.length, "{count} skill", "{count} skills"),
    tp(profile.languages.length, "{count} language", "{count} languages"),
    tp(profile.references.length, "{count} reference", "{count} references"),
  ].join(", ");
}
