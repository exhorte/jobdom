"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

import { DownloadPdfButton } from "@/components/documents/download-pdf-button";
import { toast } from "@/components/toast";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { useTrackSave } from "@/components/save-tracker";
import { useJob } from "@/hooks/use-job";
import { intlLocale, listOf, t, tp } from "@/lib/i18n";
import { IMPORT_MAX_BYTES, IMPORT_TOO_BIG } from "@/lib/import-limits";
import type { JobView } from "@/lib/jobs/runner";
import { downloadFrom } from "@/lib/save-file";
import { JOB_RETENTION_OPTIONS } from "@/lib/settings";

import { deleteEverything, startZippingPdfs, updateSettings } from "./actions";
import { SettingsSectionIntro } from "./settings-screen";

type ZipResult = { file: string; fileName: string; documents: number };
/** Nightly backups (E10-7) as the server sees them. */
export type BackupStatus = {
  on: boolean;
  retentionDays: number;
  /** DOSSIER_DATA_DIR/backups */
  dir: string;
  /** "today at 03:00", or null before the first one. */
  lastRun: string | null;
  /** Why the last one failed, if it did. */
  problem: string | null;
};

type Summary = { applications: number; roles: number; skills: number; themes: number; notes: number };
type Preview = { file: File; incoming: Summary; current: Summary; exportedAt: string };

/** "8 applications, 3 roles, 12 skills and 1 custom theme" */
function describe({ applications, roles, skills, themes }: Summary): string {
  const parts = [
    tp(applications, "{count} application", "{count} applications"),
    tp(roles, "{count} role", "{count} roles"),
    tp(skills, "{count} skill", "{count} skills"),
  ];
  if (themes > 0) parts.push(tp(themes, "{count} custom theme", "{count} custom themes"));
  return listOf(parts);
}

/** An import request's answer: the JSON, or a plain error. */
async function send(file: File, preview: boolean): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const response = await fetch(`/api/import${preview ? "?preview=1" : ""}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: file,
    });
    const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (response.status === 413) return { ok: false, error: typeof body?.error === "string" ? body.error : t("That file is too big for this server to accept.") };
    if (!response.ok || !body) return { ok: false, error: typeof body?.error === "string" ? body.error : t("The import didn't work. Try again.") };
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: t("You seem to be offline. Try again when you're connected.") };
  }
}

/**
 * Settings → Your data (E10-4 to E10-8, SET-10, SET-11): take everything
 * out, bring it back, keep backups, or delete it all.
 */
export function DataSection({
  hasApiKey,
  exportName,
  backups,
  jobRetentionHours,
}: {
  hasApiKey: boolean;
  exportName: string;
  backups: BackupStatus;
  /** How long finished background jobs are kept. */
  jobRetentionHours: number;
}) {
  const [includeKey, setIncludeKey] = useState(false);
  const router = useRouter();
  const track = useTrackSave();
  const [nightly, setNightly] = useState(backups.on);
  const [retention, setRetention] = useState(jobRetentionHours);
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [importing, setImporting] = useState(false);
  const [zipJob, setZipJob] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // E10-5: follow the zip; when it's ready, offer it.
  const zip = useJob<ZipResult>(zipJob, 0, (job: JobView<ZipResult>) => {
    if (job.status === "FAILED") toast(job.error ?? t("The zip couldn't be made. Try again."));
    if (job.status === "DONE" && job.result) {
      toast(t("{fileName} is ready.", { fileName: job.result.fileName }), {
        action: { label: t("Download"), onClick: () => downloadFrom(`/api/downloads/${job.id}`) },
      });
    }
  });
  const zipping = starting || (zip !== null && zip.status !== "DONE" && zip.status !== "FAILED");

  // E10-6: read the file, say what it replaces, and only then import.
  const chooseFile = async (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    if (file.size > IMPORT_MAX_BYTES) return toast(IMPORT_TOO_BIG);
    setImporting(true);
    const result = await send(file, true);
    setImporting(false);
    if (!result.ok) return toast(result.error);
    setPreview({ file, ...(result.data as Omit<Preview, "file">) });
  };

  const runImport = async (file: File) => {
    setImporting(true);
    toast(t("Backing up your data, then importing…"));
    const result = await send(file, false);
    setImporting(false);
    if (!result.ok) return toast(result.error);
    toast(t("Imported. Your previous data is backed up as {result}.", { result: String(result.data.backup) }));
    router.refresh();
  };

  const switchBackups = (on: boolean) => {
    setNightly(on);
    void track(updateSettings({ nightlyBackup: on })).then((result) => {
      if (!result.ok) {
        setNightly(!on);
        toast(result.error);
      }
    });
  };

  const changeRetention = (hours: number) => {
    const before = retention;
    setRetention(hours);
    void track(updateSettings({ jobRetentionHours: hours })).then((result) => {
      if (!result.ok) {
        setRetention(before);
        toast(result.error);
      }
    });
  };

  const zipAll = async () => {
    setStarting(true);
    const result = await startZippingPdfs({});
    setStarting(false);
    if (!result.ok) return toast(result.error);
    setZipJob(result.data.jobId);
    toast(t("Zipping {documents} documents. This takes a moment.", { documents: result.data.documents }));
  };

  return (
    <>
      <SettingsSectionIntro title={t("Your data")}>
        {t("Everything you enter lives in one database on your server, and nothing is sold: there's no one to sell it to. What leaves it goes to the AI provider and job source you choose, Google if you connect Gmail, and the daily usage ping and update check (see About).")}
      </SettingsSectionIntro>
      <Card padding="none" className="flex flex-col px-7 pt-1.5 pb-2.5">
        <DataRow
          title={t("Export everything")}
          description={t("Profile, applications, documents and themes in one JSON file. Handy for backups or moving servers.")}
          action={
            <DownloadPdfButton
              variant="secondary"
              size="sm"
              href={`/api/export${includeKey ? "?apiKey=1" : ""}`}
              held={false}
              progress={`Preparing ${exportName}…`}
            >
              {t("Export")}
            </DownloadPdfButton>
          }
        >
          {hasApiKey && (
            <Checkbox
              className="pt-1"
              label={t("Include my API keys")}
              checked={includeKey}
              onChange={(event) => setIncludeKey(event.target.checked)}
              hint={
                includeKey
                  ? t("Your API keys (AI provider and job search) go into the file in plain text, so anyone with the file can use them. Keep it somewhere safe.")
                  : t("Left out by default: another server couldn't read the encrypted copy anyway.")
              }
            />
          )}
        </DataRow>
        <DataRow
          title={t("Download all PDFs")}
          description={t("Every tailored resume and cover letter, zipped and sorted by company.")}
          action={
            <Button variant="secondary" size="sm" aria-disabled={zipping || undefined} onClick={() => !zipping && void zipAll()}>
              {zipping ? t("Zipping…") : t("Download")}
            </Button>
          }
        >
          {zipping && zip?.step && (
            <p role="status" className="text-meta text-muted">
              {zip.step}…
            </p>
          )}
          {zip?.status === "DONE" && zip.result && (
            <p>
              <a href={`/api/downloads/${zip.id}`} download className={buttonClassName("text", "sm", "underline underline-offset-2")}>
                {t("Download {fileName}", { fileName: zip.result.fileName })}
              </a>
            </p>
          )}
        </DataRow>
        <DataRow
          title={t("Import")}
          description={t("Restore from an export file. Your current data is backed up first.")}
          action={
            <>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => void chooseFile(event.target.files?.[0])}
              />
              <Button variant="secondary" size="sm" aria-disabled={importing || undefined} onClick={() => !importing && fileInput.current?.click()}>
                {importing ? t("Importing…") : t("Choose file")}
              </Button>
            </>
          }
        />
        <DataRow
          title={t("Keep task data for")}
          description={t("What the AI was given and wrote for a task: a posting, your resume's text, drafts you didn't turn into an application. It's kept for reloads and Undo, then deleted. Applications keep their own documents until you delete them.")}
          action={
            <Select
              aria-label={t("Keep task data for")}
              value={retention}
              onChange={(event) => changeRetention(Number(event.target.value))}
            >
              {JOB_RETENTION_OPTIONS.map((option) => (
                <option key={option.hours} value={option.hours}>
                  {t(option.label)}
                </option>
              ))}
            </Select>
          }
        />
        <div className="flex flex-col gap-2 border-t border-line py-4">
          <Toggle
            label={t("Nightly backups")}
            description={
              nightly
                ? t("Kept for {retentionDays} days in {dir}. {backups}", { retentionDays: backups.retentionDays, dir: backups.dir, backups: backups.lastRun ? t("Last one ran {lastRun}.", { lastRun: backups.lastRun }) : t("The first one runs tonight at 03:00.") })
                : t("Off. You'll only have what you export yourself.")
            }
            checked={nightly}
            onCheckedChange={switchBackups}
          />
          {nightly && backups.problem && (
            <p role="alert" className="rounded-control bg-danger-surface px-3 py-2 text-meta text-error">
              {t("The last backup failed: {problem}", { problem: backups.problem })}
            </p>
          )}
        </div>
      </Card>
      <DangerZone />
      {preview && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setPreview(null)}
          title={t("Replace everything with this export?")}
          description={
            <>
              {t("The file, exported {preview}, has {describe}. It replaces your profile, settings and {describe2}. Your current data is backed up first.", { preview: new Date(preview.exportedAt).toLocaleDateString(intlLocale("en-GB"), { day: "numeric", month: "long", year: "numeric" }), describe: describe(preview.incoming), describe2: describe(preview.current) })}
            </>
          }
          confirmLabel={t("Import and replace")}
          onConfirm={() => void runImport(preview.file)}
        />
      )}
    </>
  );
}

/** One row of the data card: what it does on the left, its control on the right. */
export function DataRow({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: ReactNode;
  action: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-line py-4 first:border-t-0">
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex min-w-[220px] flex-1 flex-col gap-[3px]">
          <h3 className="text-field">{t(title)}</h3>
          <p className="text-meta text-muted">{t(description)}</p>
        </div>
        <div className="flex-none">{action}</div>
      </div>
      {children}
    </div>
  );
}

const CONFIRMATION = "DELETE";

/** "Delete everything" (E10-8, SET-11): typed confirmation, then gone for good. */
function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const ready = typed === CONFIRMATION;

  const deleteAll = async () => {
    if (!ready) return toast(t("Type DELETE in capitals to confirm."));
    setDeleting(true);
    // On success the action takes you to the empty dashboard.
    const result = await deleteEverything({ confirm: CONFIRMATION });
    setDeleting(false);
    if (result && !result.ok) toast(result.error);
  };

  return (
    <section
      aria-labelledby="danger-heading"
      className="flex flex-col gap-3.5 rounded-panel border border-danger-line bg-danger-surface px-7 py-[22px]"
    >
      <div className="flex flex-col gap-1">
        <h3 id="danger-heading" className="text-[15px] font-medium text-error-strong">
          {t("Delete everything")}
        </h3>
        <p className="text-control text-muted">
          {t("Removes your profile, all applications and documents, your settings and the backups from this server. This can't be undone, so export first if you might want it back.")}
        </p>
      </div>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label={t("Type DELETE to confirm")}
            placeholder={t("Type DELETE to confirm")}
            // Opened on request, so the box takes focus.
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void deleteAll();
              else if (event.key === "Escape") setConfirming(false);
            }}
            className="min-w-0 flex-[1_1_200px] rounded-control border border-line-input bg-input px-3 py-2.5 font-mono text-[13.5px] focus-visible:border-error-strong focus-visible:outline-offset-0"
          />
          <Button
            variant="danger"
            size="sm"
            aria-disabled={!ready || deleting || undefined}
            onClick={() => !deleting && void deleteAll()}
            className={ready ? undefined : "bg-danger-disabled hover:bg-danger-disabled"}
          >
            {deleting ? t("Deleting…") : t("Delete for good")}
          </Button>
          <Button
            variant="text"
            size="sm"
            className="px-3!"
            onClick={() => {
              setConfirming(false);
              setTyped("");
            }}
          >
            {t("Cancel")}
          </Button>
        </div>
      ) : (
        <div>
          <Button variant="danger-outline" size="sm" onClick={() => setConfirming(true)}>
            {t("Delete everything…")}
          </Button>
        </div>
      )}
    </section>
  );
}
