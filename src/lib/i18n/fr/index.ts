import { part1 } from "./part1";
import { part2 } from "./part2";
import { part3 } from "./part3";
import { part4 } from "./part4";
import { part5 } from "./part5";
import { part6 } from "./part6";
import { part7 } from "./part7";
import { shell } from "./shell";

/**
 * The French of every word in the app, by its English. A plural is one entry,
 * "one|other" in both languages: `"{count} job|{count} jobs": "{count} offre|{count} offres"`.
 *
 * Choices, to keep the screens alike: the interface says "vous"; "CV" for a
 * resume; "lettre de motivation" for a cover letter; "candidature" for an
 * application; "offre" for a job posting and "proposition" for an employment
 * offer; "brouillon" for a draft. English stays where French software uses it:
 * "Agent", "Startups", "token", "e-mail" is written "e-mail", and the names of
 * products and services (Gmail, Google Calendar, Anthropic, JSearch…).
 * Typesetting (no-break spaces, typographic apostrophes) is added by `t`.
 */
export const fr: Readonly<Record<string, string>> = {
  ...shell,
  ...part1,
  ...part2,
  ...part3,
  ...part4,
  ...part5,
  ...part6,
  ...part7,
};
