import { tx } from "@/lib/i18n";

/**
 * The profile's sections, in order: skills come before experience so they can
 * be attached to roles. Optional ones don't count towards Profile strength (#216).
 */
export const SECTIONS = [
  {
    id: "basics",
    optional: false,
    label: tx("Basics"),
    title: tx("The basics"),
    hint: tx("How employers can reach you. Only what you choose to show ends up on a resume."),
  },
  {
    id: "skills",
    optional: false,
    label: tx("Skills & languages"),
    title: tx("Skills & languages"),
    hint: tx("Type one and press Enter. Next, you'll attach them to each role under Experience so the AI knows where you used them."),
  },
  {
    id: "experience",
    optional: false,
    label: tx("Experience"),
    title: tx("Work experience"),
    hint: tx("Add the roles you're proud of. Rough bullet points are totally fine: each application gets its own polished version."),
  },
  {
    id: "projects",
    optional: true,
    label: tx("Projects"),
    title: tx("Projects"),
    hint: tx("Side projects, open source, coursework or a thesis: things you built that show what you can do, especially when your roles don't say it yet."),
  },
  {
    id: "education",
    optional: false,
    label: tx("Education"),
    title: tx("Education"),
    hint: tx("Degrees, courses, certificates: anything that helps tell your story."),
  },
  {
    id: "publications",
    optional: true,
    label: tx("Publications"),
    title: tx("Publications"),
    hint: tx("Papers, articles, books or chapters, cited your way. They go on resumes word for word, in the order you set here."),
  },
  {
    id: "references",
    optional: true,
    label: tx("References"),
    title: tx("References"),
    hint: tx("People who'll vouch for you. They stay private unless you include them."),
  },
  {
    id: "facts",
    optional: true,
    label: tx("Facts about me"),
    title: tx("Facts about me"),
    hint: tx("What the AI should know about you that the rest of your profile doesn't say. It reads these when it writes your resumes and cover letters, and never copies them onto a resume as a list."),
  },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/** The section in `?section=`, or Basics when it's missing or unknown. */
export function sectionFromParam(value: string | string[] | undefined): SectionId {
  return SECTIONS.find((section) => section.id === value)?.id ?? "basics";
}

export const sectionHref = (id: SectionId) => `/profile?section=${id}`;
