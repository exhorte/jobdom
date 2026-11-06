import type { Tone } from "@/generated/prisma/enums";
import type { Match, Unit } from "@/lib/application-data";
import { listOf, t, tp } from "@/lib/i18n";
import { isParagraph } from "@/lib/letter-frame";
import { sameName, type ProfileData } from "@/lib/profile";
import { TONES } from "@/lib/tones";

// The first message on a new application: what was tailored (E7-6, SET-5).
// Built in code from the documents, the profile and the match, never written
// by the model, so it can't describe a change that didn't happen
// (decided 28 September 2026).

export type TailoringSummary = { intro: string; list: string[]; foot: string };

const same = (a: string, b: string) => a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();

export function tailoringSummary({
  profile,
  company,
  role,
  match,
  resume,
  letter,
  tone,
  note,
  references,
  strict,
  showChanges,
}: {
  profile: ProfileData;
  company: string;
  role: string;
  match: Match;
  resume: Unit[];
  letter: Unit[];
  tone: Tone;
  note: string;
  /** Whether the tailored resume includes references, and why not when it doesn't. */
  references: "included" | "not-asked" | "setting-off";
  strict: boolean;
  /** Settings → "Show what changed" (SET-5). */
  showChanges: boolean;
}): TailoringSummary {
  const where = company.trim() || t("this job");
  const unit = (id: string) => resume.find((entry) => entry.id === id);
  const list: string[] = [];

  const summary = unit("summary")?.text ?? "";
  const roleName = role.trim();
  if (summary && !profile.basics.summary.trim()) {
    list.push(roleName ? t("Wrote a summary for the {role} role", { role: roleName }) : t("Wrote a summary for this job"));
  } else if (summary && !same(summary, profile.basics.summary)) {
    list.push(roleName ? t("Rewrote your summary for the {role} role", { role: roleName }) : t("Rewrote your summary for this job"));
  }

  const reworded = profile.experience.filter((entry) => {
    const tailored = unit(`experience:${entry.id}`);
    return tailored && !same(tailored.text, entry.bullets.split("\n").map((line) => line.trim()).filter(Boolean).join("\n"));
  });
  if (reworded.length > 0) {
    list.push(
      reworded.length === profile.experience.length && reworded.length > 1
        ? t("Reworded all {count} roles to lead with what {where} asks for", { count: reworded.length, where })
        : tp(reworded.length, "Reworded your {names} role for this job", "Reworded your {names} roles for this job", { names: listOf(reworded.map((entry) => entry.company || entry.role)) }),
    );
  }

  const projects = profile.projects.filter((entry) => {
    const tailored = unit(`project:${entry.id}`);
    return tailored && !same(tailored.text, entry.bullets.split("\n").map((line) => line.trim()).filter(Boolean).join("\n"));
  });
  if (projects.length > 0) {
    list.push(tp(projects.length, "Reworded your {names} project for this job", "Reworded your {names} projects for this job", { names: listOf(projects.map((entry) => entry.name || t("untitled"))) }));
  }

  const publications = resume.filter((entry) => entry.id.startsWith("publication:")).length;
  if (publications > 0) list.push(tp(publications, "Kept your publication word for word", "Kept your {count} publications word for word"));

  const skills = (unit("skills")?.text ?? "").split(" · ").filter(Boolean);
  const profileSkills = profile.skills.map((skill) => skill.name);
  const kept = profileSkills.filter((name) => skills.some((skill) => sameName(skill, name)));
  if (skills.length > 1 && !skills.every((skill, index) => kept[index] && sameName(skill, kept[index]))) {
    list.push(t("Ordered your skills by what {where} asks for", { where }));
  }
  const dropped = profileSkills.filter((name) => !skills.some((skill) => sameName(skill, name)));
  if (skills.length > 0 && dropped.length > 0) {
    list.push(dropped.length <= 3 ? t("Left out {names}, which this job isn't about", { names: listOf(dropped) }) : t("Left out {count} skills that don't help here", { count: dropped.length }));
  }

  if (profile.references.length > 0) {
    list.push(
      references === "included"
        ? t("Included your references, since the posting asks for them")
        : references === "not-asked"
          ? t("Left out references, since the posting doesn't ask for them")
          : t("Left out references, as set in Settings"),
    );
  }

  if (letter.some(isParagraph)) list.push(t("Wrote a {tone} cover letter", { tone: t(TONES[tone].label).toLowerCase() }));
  const gaps = match.items.filter((item) => item.result === "gap").map((item) => `“${item.requirement}”`);
  if (gaps.length > 0) {
    list.push(
      gaps.length === 1
        ? t("Worth being ready to talk about {names}, since it isn't in your profile", { names: listOf(gaps) })
        : t("Worth being ready to talk about {names}, since they aren't in your profile", { names: listOf(gaps) }),
    );
  }
  if (note.trim()) list.push(t("Took your note into account: “{note}”", { note: note.trim() }));

  const flagged = [...resume, ...letter].reduce((count, entry) => count + (entry.unverified?.length ?? 0), 0);
  if (strict && flagged > 0) {
    list.push(tp(flagged, "Marked one detail to check (not in your profile or the posting)", "Marked {count} details to check (not in your profile or the posting)"));
  }

  const foot = !strict
    ? t("“Never invent experience” is off, so check the facts before you send anything.")
    : flagged > 0
      ? t("Double-check the marked details before you send anything.")
      : t("Nothing invented: every line comes from your profile.");

  return showChanges
    ? { intro: t("Here's what I tailored for {where}:", { where }), list, foot }
    : { intro: t("Your tailored resume and cover letter for {where} are ready.", { where }), list: [], foot };
}

/** The message as stored: intro, a bulleted list, the footnote. */
export function summaryText({ intro, list, foot }: TailoringSummary): string {
  return [intro, list.length > 0 ? list.map((line) => `- ${line}`).join("\n") : null, foot].filter(Boolean).join("\n\n");
}
