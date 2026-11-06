"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/cn";
import { ARBEITSAGENTUR_NOTE_PARTS, ARBEITSAGENTUR_TERMS_URL } from "@/lib/job-search/sources";
import { t } from "@/lib/i18n";
import { rich } from "@/lib/i18n/rich";

/**
 * The Bundesagentur für Arbeit's note (#223), in Settings → Job search and
 * Find jobs: it's unofficial, and the user chooses it on their own
 * responsibility. Until "I understand" is ticked, the BA isn't searched;
 * after that the note stays, without the box.
 */
export function ArbeitsagenturNote({ accepted, onAccept, className }: { accepted: boolean; onAccept: () => Promise<boolean>; className?: string }) {
  const [saving, setSaving] = useState(false);
  const accept = async () => {
    setSaving(true);
    // Stays ticked once saved; the page then shows the note without the box.
    if (!(await onAccept())) setSaving(false);
  };
  return (
    <div role="note" className={cn("flex flex-col gap-3 rounded-card bg-warning-surface px-4 py-3 text-meta text-warning", className)}>
      <p>
        {ARBEITSAGENTUR_NOTE_PARTS.map((part) => t(part)).join("")}{" "}
        <a href={ARBEITSAGENTUR_TERMS_URL} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
          {rich("The BA's terms of use{span}", { span: <span className="sr-only"> {t("(German, opens in a new tab)")}</span> })}
        </a>
      </p>
      {!accepted && (
        <Checkbox
          label={<span className="font-medium text-ink">{t("I understand, and choose this source myself")}</span>}
          checked={saving}
          disabled={saving}
          onChange={(event) => {
            if (event.target.checked) void accept();
          }}
        />
      )}
    </div>
  );
}
