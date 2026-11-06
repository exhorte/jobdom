"use client";

import type { RefObject } from "react";

import { deleteApplication, setArchived } from "@/lib/application-actions";

import { toast, toastResult } from "./toast";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { t } from "@/lib/i18n";

/**
 * Archives an application or brings it back (E9-5), with Undo on the
 * toast. Returns whether it worked.
 */
export async function archiveApplication(id: string, archived: boolean): Promise<boolean> {
  const result = await setArchived({ id, archived });
  if (!result.ok) {
    toast(result.error);
    return false;
  }
  if (archived) {
    toast(t("Archived. It's off your board, and still counts on your dashboard."), {
      action: { label: t("Undo"), onClick: () => void setArchived({ id, archived: false }).then(toastResult) },
    });
  } else {
    toast(t("Back on your board."));
  }
  return true;
}

/** "Delete…": asks first, since the application, its documents, chat and notes can't come back. */
export function DeleteApplicationDialog({
  id,
  open,
  onOpenChange,
  onDeleted,
  returnFocusTo,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  /** The menu button it was opened from. */
  returnFocusTo?: RefObject<HTMLElement | null>;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("Delete this application?")}
      description={t("Its tailored resume and cover letter, the chat, your notes, its history and its mail from Gmail go with it. This can't be undone. Archive it instead to keep it out of the way.")}
      confirmLabel={t("Delete application")}
      returnFocusTo={returnFocusTo}
      onConfirm={async () => {
        const result = await deleteApplication({ id });
        if (!result.ok) return toast(result.error);
        toast("Application deleted.");
        onDeleted?.();
      }}
    />
  );
}
