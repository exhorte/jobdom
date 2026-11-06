"use client";

import { useState } from "react";

import { useTrackSave } from "@/components/save-tracker";
import { toast, toastResult } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { copyText } from "@/lib/copy-text";
import { t } from "@/lib/i18n";
import { rich } from "@/lib/i18n/rich";

import { disconnectClaude, setConnector } from "./actions";
import { SettingsSectionIntro } from "./settings-screen";

const LINK = "font-medium text-ink underline underline-offset-2";

/**
 * Settings → Claude connector (#221): Dossier as a connector in Claude, off
 * until it's turned on here. Then it shows the address to add in Claude,
 * and Disconnect Claude signs every Claude out.
 */
export function ConnectorSection({ initial, address }: { initial: { on: boolean }; address: string }) {
  const track = useTrackSave();
  const [on, setOn] = useState(initial.on);
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(address);
  const publicHttps = address.startsWith("https://");

  const turn = async (next: boolean) => {
    setOn(next);
    const result = toastResult(await track(setConnector({ on: next })));
    if (!result.ok) setOn(!next);
  };

  const copy = async () => toast((await copyText(address)) ? t("Address copied.") : t("Couldn't copy it. Select the address and copy it instead."));

  return (
    <>
      <SettingsSectionIntro title={t("Claude connector")}>
        {t("Use Dossier from Claude: in chats on claude.ai, in the Desktop and mobile apps, and in Claude's command-line app. Claude can search for jobs, read your profile and applications, and save the applications and fit scores it writes, on your own Claude plan. It never sends or deletes anything.")}
      </SettingsSectionIntro>

      <Card padding="none" className="px-7 py-4">
        <Toggle
          label={t("Let Claude connect")}
          description={
            on
              ? t("On. Claude connects at the address below, once you've signed in to Dossier and allowed it.")
              : t("Off. The connector's addresses aren't open on this server.")
          }
          checked={on}
          onCheckedChange={(checked) => void turn(checked)}
        />
      </Card>

      {on && (
        <>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-[7px]">
              <span className="text-label text-muted">{t("Address to add in Claude")}</span>
              <div className="flex flex-wrap items-center gap-3">
                <code className="min-w-0 flex-1 rounded-control border border-line-input bg-input px-3 py-2 font-mono text-[13px] [overflow-wrap:anywhere]">
                  {address}
                </code>
                <Button variant="secondary" size="sm" onClick={() => void copy()}>
                  {t("Copy")}
                </Button>
              </div>
            </div>
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-pretty">
              <li>
                {rich("In Claude, open {strong} and choose {strong2}.", { strong: <strong>{t("Settings → Connectors")}</strong>, strong2: <strong>{t("Add custom connector")}</strong> })}
              </li>
              <li>
                {rich("Name it {strong}, paste the address and press {strong2}, then {strong3}.", { strong: <strong>Dossier</strong>, strong2: <strong>{t("Add")}</strong>, strong3: <strong>{t("Connect")}</strong> })}
              </li>
              <li>
                {rich("Claude opens Dossier: sign in if it asks, check what Claude may do, and press {strong}.", { strong: <strong>{t("Allow")}</strong> })}
              </li>
            </ol>
            <p className="text-meta text-muted">
              {rich("In Claude's command-line app: {code}, then {code2} to sign in.", { code: <code className="font-mono text-label">claude mcp add --transport http dossier {address}</code>, code2: <code className="font-mono text-label">/mcp</code> })}
            </p>
            {!publicHttps && (
              <p role="note" className="rounded-card bg-warning-surface px-4 py-3 text-meta text-warning">
                {rich("{local}Claude on the web, Desktop and mobile reaches Dossier from Anthropic's servers, so they need a public HTTPS address (set {code} if Dossier is reached at another one). Claude's command-line app on the computer Dossier runs on can use this one.", { local: local ? t("This is a local address. ") : t("This address isn't HTTPS. "), code: <code className="font-mono text-label">DOSSIER_PUBLIC_URL</code> })}
              </p>
            )}
          </Card>

          <Card className="flex flex-col gap-3 text-sm text-pretty">
            <p>
              {rich("What Claude reads through the connector goes to Anthropic with your Claude account, as anything in a chat does: your profile without its contact details, the postings and applications it works on, and your searches. Private notes and the letter's sender and signature stay out. {link} has the details.", { link: <a href="https://github.com/AienTech/dossier/wiki/Connecting-Claude" target="_blank" rel="noopener noreferrer" className={LINK}>
                {t("Connecting Claude")}
              </a> })}
            </p>
            <p className="text-muted">
              {t("Without an AI model of Dossier's own, New application and Score in Find jobs hand the work to a new Claude chat, which saves it here through the connector.")}
            </p>
            <div>
              <Button
                variant="secondary"
                onClick={() => void track(disconnectClaude({})).then(toastResult)}
              >
                {t("Disconnect Claude")}
              </Button>
              <p className="mt-2 text-meta text-muted">{t("Signs every Claude out. Changing your password or DOSSIER_SECRET does too.")}</p>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
