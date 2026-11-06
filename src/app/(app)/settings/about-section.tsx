"use client";

import { useState } from "react";

import { useTrackSave } from "@/components/save-tracker";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { t } from "@/lib/i18n";
import { rich } from "@/lib/i18n/rich";
import { UPGRADE_GUIDE_URL, type Release } from "@/lib/releases";

import { chooseUsagePing } from "../actions";
import { USAGE_PING_PRIVACY_URL } from "../usage-ping-dialog";
import { checkUpdates, updateSettings } from "./actions";
import { SettingsSectionIntro } from "./settings-screen";

export type AboutFacts = { label: string; value: string }[];

/** The update check as the server sees it. */
export type UpdatesView = {
  /** "Check for updates daily". */
  daily: boolean;
  /** A newer release than this one, if a check has found one. */
  available: Release | null;
};

/** The usage ping as the server sees it (#172). */
export type UsagePingView = {
  host: string;
  /** Whether it's wanted; null until someone answers. */
  choice: "on" | "off" | null;
  /** Who decided: DOSSIER_TELEMETRY, or an answer in the app. */
  source: "env" | "app" | null;
  /** The install ID it sends, once the first ping has made one. */
  id: string | null;
  /** Development servers never send it. */
  production: boolean;
};

type Check = { status: "idle" } | { status: "checking" } | { status: "latest" } | ({ status: "newer" } & Release) | { status: "unknown" };

const LINK = "font-medium text-ink underline underline-offset-2";

/**
 * Settings → About (E10-9, SET-12): facts about this install, and the update
 * check: daily while it's on, and whenever asked.
 */
export function AboutSection({ facts, usagePing, updates }: { facts: AboutFacts; usagePing: UsagePingView; updates: UpdatesView }) {
  const [check, setCheck] = useState<Check>(updates.available ? { status: "newer", ...updates.available } : { status: "idle" });
  const [daily, setDaily] = useState(updates.daily);
  const [pinging, setPinging] = useState(usagePing.choice === "on");
  const [answered, setAnswered] = useState(usagePing.choice !== null);
  const track = useTrackSave();

  // Withdrawing is as easy as agreeing (GDPR Art. 7(3)); a no forgets the install ID.
  const switchPing = (on: boolean) => {
    const before = { pinging, answered };
    setPinging(on);
    setAnswered(true);
    void track(chooseUsagePing({ send: on })).then((result) => {
      if (!result.ok) {
        setPinging(before.pinging);
        setAnswered(before.answered);
        toast(result.error);
      }
    });
  };
  const fromEnv = usagePing.source === "env";
  const pingDescription = !usagePing.production
    ? t("Development servers never send it.")
    : fromEnv
      ? t("Set with DOSSIER_TELEMETRY={choice} on the server, which decides while it's set. Change it there.", { choice: usagePing.choice ?? "" })
      : pinging
        ? t("On. Once on each day Dossier is used, the server sends {host} {usagePing} and the version number. Nothing else.", { host: usagePing.host, usagePing: usagePing.id ? t("this install's ID ({id})", { id: usagePing.id }) : t("this install's ID, made with the first ping,") })
        : answered
          ? t("Off. Nothing is sent, and this install's ID is forgotten.")
          : t("Not answered yet, so nothing is sent.");

  const run = async () => {
    setCheck({ status: "checking" });
    const result = await checkUpdates({});
    setCheck(result.ok ? result.data : { status: "unknown" });
  };

  const switchDaily = (on: boolean) => {
    setDaily(on);
    void track(updateSettings({ updateCheck: on })).then((result) => {
      if (!result.ok) {
        setDaily(!on);
        toast(result.error);
      }
    });
  };

  return (
    <>
      <SettingsSectionIntro title={t("About this install")}>{t("Free and open source. No accounts, no subscriptions.")}</SettingsSectionIntro>
      <Card padding="none" className="px-7 py-2">
        <dl>
          {facts.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 border-t border-line py-3.5 text-sm first:border-t-0">
              <dt className="text-muted">{t(label)}</dt>
              <dd className="text-right font-mono text-[13px] [overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card padding="none" className="px-7 py-4">
        <Toggle
          label={t("Send the daily usage ping")}
          description={pingDescription}
          checked={usagePing.production && (fromEnv ? usagePing.choice === "on" : pinging)}
          disabled={!usagePing.production || fromEnv}
          onCheckedChange={switchPing}
        />
      </Card>
      <Card padding="none" className="px-7 py-4">
        <Toggle
          label={t("Check for updates daily")}
          description={
            daily
              ? t("Once on each day Dossier is used, the server asks GitHub for the latest release, and the sidebar says when a newer one is out.")
              : t("Off. Dossier only checks when you press Check for updates.")
          }
          checked={daily}
          onCheckedChange={switchDaily}
        />
      </Card>
      <div className="flex flex-wrap items-center gap-3.5">
        <Button variant="secondary" aria-disabled={check.status === "checking" || undefined} onClick={() => check.status !== "checking" && void run()}>
          {check.status === "checking" ? t("Checking…") : t("Check for updates")}
        </Button>
        <p role="status" className="text-control text-muted">
          {check.status === "latest" && t("You're on the latest version.")}
          {check.status === "unknown" && t("Couldn't check for updates right now.")}
          {check.status === "newer" && (
            <>
              {rich("Version {version} is available. {link} · {link2}", { version: check.version, link: <a href={check.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                {rich("See what's new {span}", { span: <span className="sr-only">{t("(opens in a new tab)")}</span> })}
              </a>, link2: <a href={UPGRADE_GUIDE_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
                {rich("How to update {span}", { span: <span className="sr-only">{t("(opens in a new tab)")}</span> })}
              </a> })}
            </>
          )}
        </p>
      </div>
      <p className="text-meta text-muted">{t("Checking asks GitHub for the latest release and sends nothing about you or this install, daily or when you press it.")}</p>
      <p className="text-meta text-muted">
        {rich("The usage ping only goes once you agree. It tells the Dossier project's maintainer, on the project's own server, how many installs are in use and how often. The ID is random and says nothing about you, and what's kept is deleted after a year. To have the rows already kept for this install removed sooner, note its ID, switch the ping off, and send the ID to {link}; you get a confirmation once they're gone. {link2}", { link: <a href="mailto:dossier.app@pm.me" className={LINK}>
          {t("dossier.app@pm.me")}
        </a>, link2: <a href={USAGE_PING_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
          {rich("More in Privacy {span}", { span: <span className="sr-only">{t("(opens in a new tab)")}</span> })}
        </a> })}
      </p>
    </>
  );
}
