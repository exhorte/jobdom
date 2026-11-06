"use client";

import { useEffect, useState } from "react";

import type { AutosaveStatus } from "@/hooks/use-autosave";
import { cn } from "@/lib/cn";
import { getLocale, intlLocale, t } from "@/lib/i18n";

/** "Saved just now", "Saved 2 min ago", or "Saved at 14:05" after an hour. */
export function savedLabel(savedAt: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - savedAt.getTime()) / 60_000);
  if (minutes < 1) return t("Saved just now");
  if (minutes < 60) return t("Saved {minutes} min ago", { minutes });
  const time = savedAt.toLocaleTimeString(getLocale() === "en" ? [] : intlLocale(), { hour: "numeric", minute: "2-digit" });
  return t("Saved at {time}", { time });
}

/** The current time, updated every `interval` ms. */
function useNow(interval: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return now;
}

/**
 * The header's autosave status, from `useAutosave`. Screen readers hear when
 * changes are saved or fail to save, but not every "Saving…" or clock tick.
 */
export function SavedIndicator({
  status,
  savedAt,
  className,
}: {
  status: AutosaveStatus;
  savedAt: Date | null;
  className?: string;
}) {
  const now = useNow(30_000);
  const visible =
    status === "saving"
      ? t("Saving…")
      : status === "error"
        ? t("Couldn't save")
        : savedAt
          ? savedLabel(savedAt, now > savedAt ? now : savedAt)
          : t("All changes saved");
  const announced =
    status === "saved"
      ? t("All changes saved.")
      : status === "error"
        ? t("Couldn't save your changes.")
        : "";

  return (
    <span className={cn("text-meta", status === "error" ? "text-error" : "text-muted", className)}>
      <span aria-hidden="true">{visible}</span>
      <span role="status" className="sr-only">
        {announced}
      </span>
    </span>
  );
}
