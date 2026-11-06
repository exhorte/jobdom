"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useTrackSave } from "@/components/save-tracker";
import { toast, toastResult } from "@/components/toast";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { checkInbox, disconnectGoogleAccount, saveGoogleClient, saveGoogleSettings } from "@/lib/google/actions";
import { cn } from "@/lib/cn";
import { t, tx } from "@/lib/i18n";
import { rich } from "@/lib/i18n/rich";

import { SettingsSectionIntro } from "./settings-screen";

export type GoogleSettings = {
  gmailRead: boolean;
  gmailScope: "known" | "all";
  gmailInterval: number;
  calendarAvailability: boolean;
  calendarEvents: boolean;
  calendarId: string;
  workDays: number[];
  workStart: string;
  workEnd: string;
  workTimeZone: string | null;
  slotMinutes: number;
  bufferMinutes: number;
};

/** Where each part of the OAuth client comes from; the secret itself never reaches the browser. */
export type GoogleClientView = {
  id: string;
  idState: "set" | "env" | "none" | "unreadable";
  secretState: "set" | "env" | "none" | "unreadable";
};

export type GoogleConnectionView =
  | { status: "not-configured" }
  | { status: "disconnected" }
  | { status: "connected"; email: string; canSend: boolean; canRead: boolean; canUseCalendar: boolean; lastSync: string | null; syncProblem: string | null };

const DAYS = [tx("Mon"), tx("Tue"), tx("Wed"), tx("Thu"), tx("Fri"), tx("Sat"), tx("Sun")];
const INTERVALS = [5, 10, 15, 30, 60];
const LENGTHS = [15, 30, 45, 60, 90];
const BUFFERS = [0, 10, 15, 30];

/** What came back from Google's consent page, as a message. */
export const CALLBACK_MESSAGES: Record<string, string> = {
  connected: tx("Connected to Google."),
  denied: tx("Google wasn't given access, so nothing changed."),
  expired: tx("That took too long or didn't start here. Try connecting again."),
  rejected: tx("Google refused the sign-in. Check the client ID and secret below."),
  failed: tx("Connecting to Google didn't work. Try again."),
  "not-configured": tx("Google isn't set up on this server yet. See the steps below."),
};

/**
 * Settings → Google (E15-1): connect Gmail and Calendar, choose what Dossier
 * reads, and set the working hours that interview times are offered in.
 * Every field saves on its own. Nothing is ever sent without asking.
 */
export function GoogleSection({
  connection,
  client,
  initial,
  browserTimeZone,
  redirectUri,
}: {
  connection: GoogleConnectionView;
  client: GoogleClientView;
  initial: GoogleSettings;
  browserTimeZone: string | null;
  /** The address to register in Google Cloud. */
  redirectUri: string;
}) {
  const track = useTrackSave();
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [timeZone, setTimeZone] = useState(initial.workTimeZone ?? "");
  const [calendarId, setCalendarId] = useState(initial.calendarId);
  const [confirming, setConfirming] = useState(false);
  const [checking, startChecking] = useTransition();

  const change = (next: Partial<GoogleSettings>) => {
    const previous = settings;
    setSettings({ ...settings, ...next });
    void track(saveGoogleSettings(next as Parameters<typeof saveGoogleSettings>[0])).then((result) => {
      if (!toastResult(result).ok) setSettings(previous);
    });
  };

  const toggleDay = (day: number) =>
    change({ workDays: settings.workDays.includes(day) ? settings.workDays.filter((entry) => entry !== day) : [...settings.workDays, day].sort() });

  const disconnect = async () => {
    if (toastResult(await disconnectGoogleAccount({})).ok) router.refresh();
  };

  const checkNow = () =>
    startChecking(async () => {
      toastResult(await checkInbox({}));
      router.refresh();
    });

  if (connection.status === "not-configured") return <SetupSteps redirectUri={redirectUri} client={client} />;

  return (
    <>
      <SettingsSectionIntro title="Google">
        {t("Send applications from your Gmail, see employers' replies next to each application, and offer interview times from your calendar. Dossier always asks before it sends anything.")}
      </SettingsSectionIntro>

      <Card className="flex flex-col gap-4">
        {connection.status === "connected" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p role="status" className="flex items-center gap-2 text-control">
                {rich("{span}Connected as {span2}", { span: <span aria-hidden className="size-2 flex-none rounded-full bg-success" />, span2: <span className="font-medium">{connection.email}</span> })}
              </p>
              <Button variant="danger-outline" size="sm" onClick={() => setConfirming(true)}>
                {t("Disconnect")}
              </Button>
            </div>
            <ul className="flex flex-col gap-1.5 text-meta text-muted">
              <Permission granted={connection.canSend} group="send" label={t("Send email from your address")} />
              <Permission granted={connection.canRead} group="read" label={t("Read your mail, to find replies to your applications")} />
              <Permission granted={connection.canUseCalendar} group="calendar" label={t("See when you're free and add interviews to your calendar")} />
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted">
              {t("You'll sign in on Google's own page and choose what Dossier may do. Tokens are stored encrypted on your server and never leave it, except to talk to Google.")}
            </p>
            <a href="/api/google/connect" className={buttonClassName("primary", "md", "hover:text-on-primary")}>
              {t("Connect Google account")}
            </a>
          </div>
        )}
      </Card>

      {connection.status === "connected" && (
        <>
          <Card padding="none" className="flex flex-col px-7 pt-1.5 pb-5">
            <Toggle
              className="py-4"
              label={t("Read replies")}
              description={t("Check Gmail for employers' replies, link them to applications and have the AI read them.")}
              checked={settings.gmailRead}
              disabled={!connection.canRead}
              onCheckedChange={(gmailRead) => change({ gmailRead })}
            />
            {settings.gmailRead && connection.canRead && (
              <div className="flex flex-col gap-4 border-t border-line pt-4">
                <div className="flex flex-col gap-[7px]">
                  <span id="gmail-scope" className="text-label text-muted">
                    {t("Which mail")}
                  </span>
                  <SegmentedControl<"known" | "all">
                    aria-labelledby="gmail-scope"
                    size="sm"
                    options={[
                      { value: "known", label: "Threads I started and company domains" },
                      { value: "all", label: "Every new email" },
                    ]}
                    value={settings.gmailScope}
                    onValueChange={(gmailScope) => change({ gmailScope })}
                  />
                  <p className="text-meta text-muted">
                    {settings.gmailScope === "known"
                      ? t("Only mail that matches an application is kept and sent to the AI.")
                      : t("Mail that doesn't match an application waits under Needs a look. With a hosted AI, it's sent to the provider to be read.")}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <Select
                    label={t("Check every")}
                    className="w-40"
                    value={settings.gmailInterval}
                    onChange={(event) => change({ gmailInterval: Number(event.target.value) })}
                  >
                    {INTERVALS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {t("{minutes} minutes", { minutes })}
                      </option>
                    ))}
                  </Select>
                  <Button variant="secondary" onClick={checkNow} disabled={checking}>
                    {checking ? t("Checking…") : t("Check now")}
                  </Button>
                  <p role="status" className={cn("flex items-center gap-2 pb-2 text-control", connection.syncProblem ? "text-error" : "text-muted")}>
                    {connection.syncProblem ?? (connection.lastSync ? t("Last checked {lastSync}", { lastSync: connection.lastSync }) : t("Not checked yet"))}
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card padding="none" className="flex flex-col px-7 pt-1.5 pb-6">
            <Toggle
              className="py-4"
              label={t("Offer times from my calendar")}
              description={t("When an employer asks to meet, the drafted answer offers times you're free.")}
              checked={settings.calendarAvailability}
              disabled={!connection.canUseCalendar}
              onCheckedChange={(calendarAvailability) => change({ calendarAvailability })}
            />
            <Toggle
              className="border-t border-line py-4"
              label={t("Add interviews to my calendar")}
              description={t("Once a time is agreed, add it with a link back to the application, and keep it in step: a time changed here or in Google changes on both sides.")}
              checked={settings.calendarEvents}
              disabled={!connection.canUseCalendar}
              onCheckedChange={(calendarEvents) => change({ calendarEvents })}
            />
            <div className="grid gap-x-[18px] gap-y-5 border-t border-line pt-5 sm:grid-cols-2">
              <div className="flex flex-col gap-[7px] sm:col-span-2">
                <span id="work-days" className="text-label text-muted">
                  {t("Working days")}
                </span>
                <div role="group" aria-labelledby="work-days" className="flex flex-wrap gap-1.5">
                  {DAYS.map((label, index) => {
                    const on = settings.workDays.includes(index + 1);
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDay(index + 1)}
                        className={cn(
                          "min-w-12 rounded-control border px-2.5 py-1.5 text-control",
                          on ? "border-primary bg-selected font-medium text-ink" : "border-line-field bg-input text-muted hover:border-line-strong",
                        )}
                      >
                        {t(label)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Input label={t("From")} type="time" value={settings.workStart} onChange={(event) => event.target.value && change({ workStart: event.target.value })} />
              <Input label={t("Until")} type="time" value={settings.workEnd} onChange={(event) => event.target.value && change({ workEnd: event.target.value })} />
              <Select label={t("Interview length")} value={settings.slotMinutes} onChange={(event) => change({ slotMinutes: Number(event.target.value) })}>
                {LENGTHS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {t("{minutes} minutes", { minutes })}
                  </option>
                ))}
              </Select>
              <Select label={t("Keep free around meetings")} value={settings.bufferMinutes} onChange={(event) => change({ bufferMinutes: Number(event.target.value) })}>
                {BUFFERS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes === 0 ? t("No gap") : t("{minutes} minutes", { minutes })}
                  </option>
                ))}
              </Select>
              <Input
                label={t("Time zone")}
                placeholder={browserTimeZone ?? "Europe/Berlin"}
                hint={browserTimeZone ? t("Empty uses your browser's: {browserTimeZone}", { browserTimeZone }) : t("Empty uses your browser's")}
                value={timeZone}
                spellCheck={false}
                onChange={(event) => setTimeZone(event.target.value)}
                onBlur={() => timeZone.trim() !== (settings.workTimeZone ?? "") && change({ workTimeZone: timeZone.trim() || null })}
              />
              <Input
                label={t("Calendar")}
                hint={t("primary is your main calendar; or a calendar's ID from Google Calendar's settings")}
                value={calendarId}
                spellCheck={false}
                onChange={(event) => setCalendarId(event.target.value)}
                onBlur={() => calendarId.trim() && calendarId.trim() !== settings.calendarId && change({ calendarId: calendarId.trim() })}
              />
            </div>
          </Card>
        </>
      )}

      <ClientCard initial={client} connected={connection.status === "connected"} />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("Disconnect Google?")}
        description={t("Dossier's access is revoked at Google. Mail already in Dossier stays; nothing new comes in until you connect again.")}
        confirmLabel={t("Disconnect")}
        onConfirm={() => void disconnect()}
      />
    </>
  );
}

/** A permission and, while it's missing, the link to allow it. */
function Permission({ granted, group, label }: { granted: boolean; group: string; label: string }) {
  return (
    <li className="flex flex-wrap items-center gap-2">
      <span aria-hidden className={cn("size-1.5 flex-none rounded-full", granted ? "bg-success" : "bg-faint")} />
      <span className={cn(granted && "text-ink")}>{t(label)}</span>
      {!granted && (
        <a href={`/api/google/connect?scopes=${group}`} className="underline underline-offset-3">
          {t("Allow")}
        </a>
      )}
      <span className="sr-only">{granted ? "(allowed)" : "(not allowed)"}</span>
    </li>
  );
}

/** Before the server has a Google client: how to make one. */
function SetupSteps({ redirectUri, client }: { redirectUri: string; client: GoogleClientView }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri);
      toast(t("Copied the redirect URI."));
    } catch {
      toast(t("That didn't copy. Select it and copy it yourself."));
    }
  };
  return (
    <>
      <SettingsSectionIntro title="Google">
        {t("Connect Gmail and Google Calendar to send applications, read replies and offer interview times. First, give this server a Google OAuth client.")}
      </SettingsSectionIntro>
      <Card className="flex flex-col gap-4 text-sm">
        <ol className="flex list-decimal flex-col gap-2.5 pl-5">
          <li>
            {rich("In {span}, create a project and enable the {span2} and the {span3}.", { span: <span className="font-medium">{t("Google Cloud Console")}</span>, span2: <span className="font-medium">{t("Gmail API")}</span>, span3: <span className="font-medium">{t("Google Calendar API")}</span> })}
          </li>
          <li>
            {rich("Set up the {span} as External, add yourself as a test user, then {span2} it (In production). Unpublished, Google stops the access after 7 days.", { span: <span className="font-medium">{t("OAuth consent screen")}</span>, span2: <span className="font-medium">{t("publish")}</span> })}
          </li>
          <li>
            {rich("Create an {span} of type Web application, with this authorised redirect URI:{span2}", { span: <span className="font-medium">{t("OAuth client ID")}</span>, span2: <span className="mt-1.5 flex items-center gap-2">
              <code className="rounded-control border border-line-field bg-input px-2 py-1 font-mono text-label [overflow-wrap:anywhere]">
                {redirectUri}
              </code>
              <Button variant="text" size="sm" onClick={() => void copy()}>
                {t("Copy")}
              </Button>
            </span> })}
          </li>
          <li>{t("Paste the client's ID and secret below.")}</li>
        </ol>
      </Card>
      <ClientCard initial={client} connected={false} />
    </>
  );
}

const SECRET_PLACEHOLDER: Record<GoogleClientView["secretState"], string> = {
  set: tx("Saved · type a new secret to replace it"),
  env: tx("Using DOSSIER_GOOGLE_CLIENT_SECRET · type one to save it here"),
  none: tx("Stored encrypted on your server"),
  unreadable: tx("Stored encrypted on your server"),
};

/**
 * The OAuth client: its ID, and a write-only secret, each saved when you
 * leave its field. Saved here, they override the DOSSIER_GOOGLE_CLIENT_*
 * variables. A different client ID disconnects the account.
 */
function ClientCard({ initial, connected }: { initial: GoogleClientView; connected: boolean }) {
  const track = useTrackSave();
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [id, setId] = useState(initial.id);
  const [secret, setSecret] = useState("");

  const save = async (change: Parameters<typeof saveGoogleClient>[0]) => {
    const result = toastResult(await track(saveGoogleClient(change)));
    if (!result.ok) return false;
    setView(result.data);
    setId(result.data.id);
    router.refresh();
    return true;
  };

  const saveId = () => {
    if (id.trim() === view.id) return;
    void save({ id });
  };
  const saveSecret = async () => {
    if (!secret.trim()) return;
    if (await save({ secret: { action: "set", value: secret } })) setSecret("");
  };

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-control font-medium">{t("OAuth client")}</h3>
        <p className="text-meta text-muted">
          {connected ? t("Changing the client ID disconnects your Google account; connect again afterwards.") : t("Saved on this server, so no restart is needed.")}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-x-[18px] gap-y-5 sm:grid-cols-2">
        <Input
          label={t("Client ID")}
          value={id}
          placeholder={view.idState === "env" ? t("Using DOSSIER_GOOGLE_CLIENT_ID") : "…apps.googleusercontent.com"}
          hint={view.idState === "env" ? t("From DOSSIER_GOOGLE_CLIENT_ID · type one to save it here") : undefined}
          spellCheck={false}
          autoComplete="off"
          inputClassName="font-mono text-[13.5px]"
          onChange={(event) => setId(event.target.value)}
          onBlur={saveId}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              saveId();
            }
          }}
        />
        <div className="flex flex-col gap-2.5">
          <Input
            label={t("Client secret")}
            type="password"
            autoComplete="off"
            value={secret}
            placeholder={SECRET_PLACEHOLDER[view.secretState]}
            error={view.secretState === "unreadable" ? "The saved secret can't be read, probably since DOSSIER_SECRET changed. Enter it again." : undefined}
            onChange={(event) => setSecret(event.target.value)}
            onBlur={() => void saveSecret()}
            onKeyDown={(event) => {
              if (event.key === "Enter" && secret.trim()) {
                event.preventDefault();
                void saveSecret();
              }
            }}
          />
          {(view.secretState === "set" || view.secretState === "unreadable") && (
            <Button variant="text" size="sm" className="self-start" onClick={() => void save({ secret: { action: "clear" } })}>
              {t("Remove saved secret")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
