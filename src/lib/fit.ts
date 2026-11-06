import { t } from "@/lib/i18n";

// How well a posting fits the profile (#208, E16-2): a score from
// score-posting, with why. Shared by Find jobs and the Agent screen.

export type PostingFit = { score: number; reasons: string[]; redFlags: string[] };

/** The score's band, as the prompt defines them: "Good fit". */
export function fitBand(score: number): string {
  if (score >= 85) return t("Excellent fit");
  if (score >= 70) return t("Good fit");
  if (score >= 50) return t("Possible fit");
  return t("Poor fit");
}
