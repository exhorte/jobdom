import { tx } from "@/lib/i18n";

// The named steps of the new application flow's jobs (NEW-2, NEW-7), shared
// by the jobs that report them and the page that shows them.

export const READ_POSTING_STEPS = [
  tx("Reading the posting"),
  tx("Picking out the role, company and requirements"),
  tx("Comparing it with your profile"),
] as const;

export const WRITE_DOCUMENTS_STEPS = [tx("Tailoring your resume"), tx("Writing your cover letter"), tx("Saving the application")] as const;
