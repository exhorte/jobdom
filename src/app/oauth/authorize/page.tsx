import type { Metadata } from "next";

import { BrandMark } from "@/components/brand-mark";
import { verifySession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { rich } from "@/lib/i18n/rich";

import { Consent } from "./consent";
import { checkAuthorizeRequest } from "./request";
import { applyLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return { title: t("Connect Claude") };
}

/**
 * Claude asks to use Dossier through the connector (#221, src/app/api/mcp).
 * Signed-out visitors sign in first: the proxy sends them to /login and back.
 */
export default async function AuthorizePage({ searchParams }: PageProps<"/oauth/authorize">) {
  await verifySession();
  const params = await searchParams;
  const checked = await checkAuthorizeRequest(params);
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-8 py-12">
      <div className="flex w-full max-w-[460px] flex-col gap-6">
        <div className="flex items-center gap-3">
          <BrandMark className="size-10" />
          <h1 className="font-serif text-[26px] font-medium tracking-[-0.01em]">{t("Connect Claude to Dossier")}</h1>
        </div>
        {"error" in checked ? (
          <p role="alert" className="rounded-control bg-danger-surface px-3 py-2 text-sm text-error">
            {checked.error}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 text-sm leading-[1.6] text-pretty">
              <p>
                {rich("{strong} wants to use your Dossier. Once you allow it, Claude can:", { strong: <strong>{checked.clientName}</strong> })}
              </p>
              <ul className="list-disc pl-5 text-muted">
                <li>{t("search for jobs with your job source, and score postings against your profile")}</li>
                <li>{t("read your profile and your applications, with their resumes and cover letters, but not your contact details or notes")}</li>
                <li>{t("save applications it writes for you as drafts, and change their status")}</li>
              </ul>
              <p className="text-muted">
                {rich("It can never send an application or an email, or delete anything. Allow it only if you've just added Dossier as a connector in Claude yourself: it sends you back to {strong}. Disconnect Claude in Settings → Claude connector at any time.", { strong: <strong className="text-ink">{new URL(checked.redirectUri).host}</strong> })}
              </p>
            </div>
            <Consent
              request={{
                client_id: checked.clientId,
                redirect_uri: checked.redirectUri,
                code_challenge: checked.codeChallenge,
                code_challenge_method: one(params.code_challenge_method),
                state: checked.state,
                resource: checked.resource,
              }}
            />
          </>
        )}
      </div>
    </main>
  );
}
