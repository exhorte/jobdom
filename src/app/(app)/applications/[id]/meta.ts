import { formatCalendarDate, formatDate } from "@/lib/dates";
import { t } from "@/lib/i18n";

/** Location · work mode · salary · "Apply by …" · "Created …", leaving out empty parts (APP-1). */
export function metaLine(application: {
  location: string;
  mode: string;
  salary: string;
  deadline: Date | null;
  createdAt: Date;
}): string[] {
  return [
    application.location.trim(),
    application.mode.trim(),
    application.salary.trim(),
    application.deadline ? t("Apply by {formatCalendarDate}", { formatCalendarDate: formatCalendarDate(application.deadline) }) : "",
    t("Created {formatDate}", { formatDate: formatDate(application.createdAt) }),
  ].filter(Boolean);
}
