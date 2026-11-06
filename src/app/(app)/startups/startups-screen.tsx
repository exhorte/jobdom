"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { PageHeader } from "@/components/page-header";
import { ScoreBadge } from "@/components/score-badge";
import { toast, toastResult } from "@/components/toast";
import { Button, buttonClassName } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useJob } from "@/hooks/use-job";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/dates";
import { t, tp, tx } from "@/lib/i18n";
import { rich } from "@/lib/i18n/rich";
import { postedAgo } from "@/lib/job-search/search";
import {
  STARTUP_SOURCE_INFO,
  STARTUP_SOURCES,
  startupFilterHref,
  type StartupEmail,
  type StartupFilter,
  type StartupsRefresh,
  type StartupStatusName,
  type StartupView,
} from "@/lib/startups/types";

import { lookUpStartupAddresses, refreshStartupsNow, removeStartupForGood, saveStartupNotes, setStartupStatus } from "./actions";

export type StartupsScreenProps = {
  filter: StartupFilter;
  list: { startups: StartupView[]; total: number; counts: Record<StartupStatusName, number> };
  lastRefresh: StartupsRefresh | null;
  refreshJobId: string | null;
  /** The profile's city and country, for the place filter; "" when not set. */
  city: string;
  country: string;
  /** The profile's headline, for the subject of an email from the user's own mail. */
  headline: string;
  /** Whether an AI provider is set up, so "Write to them" can start an application. */
  aiReady: boolean;
  today: string;
};

const VIEWS: { status: StartupStatusName; label: string }[] = [
  { status: "NEW", label: tx("To look at") },
  { status: "SAVED", label: tx("Saved") },
  { status: "CONTACTED", label: tx("Contacted") },
  { status: "DISMISSED", label: tx("Dismissed") },
];

/**
 * The Startups screen (#222): startups that are hiring, from YC startups' job
 * posts and Hacker News' "Who is hiring?", ranked against the profile, with
 * the addresses they publish for applications. Dossier sends nothing: the
 * user writes to each one, from New application or their own mail.
 */
export function StartupsScreen({ filter, list, lastRefresh, refreshJobId, city, country, headline, aiReady, today }: StartupsScreenProps) {
  const router = useRouter();
  const [jobId, setJobId] = useState(refreshJobId);
  const [starting, startTransition] = useTransition();

  const job = useJob<StartupsRefresh>(jobId, 0, (update) => {
    if (update.status !== "DONE" && update.status !== "FAILED") return;
    setJobId(null);
    if (update.status === "FAILED") return toast(update.error ?? t("The refresh didn't finish. Try again."));
    const added = update.result?.added ?? 0;
    toast(added > 0 ? tp(added, "Found {count} new startup.", "Found {count} new startups.") : t("No new startups this time."));
    router.refresh();
  });
  const refreshing = Boolean(jobId) && (!job || job.status === "QUEUED" || job.status === "RUNNING");

  const refresh = () =>
    startTransition(async () => {
      const result = toastResult(await refreshStartupsNow({}));
      if (result.ok) setJobId(result.data.jobId);
    });

  const go = (change: Partial<StartupFilter>) => router.replace(startupFilterHref({ ...filter, ...change }), { scroll: false });

  return (
    <>
      <PageHeader
        title={t("Startups")}
        description={t("Startups that are hiring, from YC startups' job posts and Hacker News' “Who is hiring?”, ranked against your profile, with the address each one publishes for applications. You write to each one yourself.")}
        actions={
          <Button aria-disabled={refreshing || starting || undefined} onClick={() => !refreshing && !starting && refresh()}>
            {refreshing ? t("Refreshing…") : t("Refresh")}
          </Button>
        }
      />
      <div className="flex flex-col gap-6 px-10 pb-20">
        <RefreshStatus lastRefresh={lastRefresh} refreshing={refreshing} step={job?.step ?? null} today={today} />
        {lastRefresh && (
          <>
            <ViewTabs filter={filter} counts={list.counts} />
            <Filters filter={filter} city={city} country={country} onChange={go} />
            {list.startups.length === 0 ? (
              <Empty filter={filter} />
            ) : (
              <>
                <p className="text-meta text-muted">
                  {list.total > list.startups.length ? t("The best {length} of {total}", { length: list.startups.length, total: list.total }) : tp(list.total, "{count} startup", "{count} startups")}
                  {filter.sort === "match" ? ", best match first." : t(", newest first.")}
                </p>
                <ul className="flex flex-col gap-3">
                  {list.startups.map((startup) => (
                    <li key={`${startup.id}:${startup.status}:${startup.emails.length}:${startup.score}`}>
                      <StartupCard startup={startup} headline={headline} aiReady={aiReady} today={today} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

function RefreshStatus({ lastRefresh, refreshing, step, today }: { lastRefresh: StartupsRefresh | null; refreshing: boolean; step: string | null; today: string }) {
  if (refreshing) {
    return (
      <p role="status" className="rounded-card border border-line-card bg-card px-4 py-3 text-meta text-muted">
        {t("{step} This takes a minute or two.", { step: step ?? t("Starting…") })}
      </p>
    );
  }
  if (!lastRefresh) {
    return (
      <div role="note" className="flex flex-col gap-2 rounded-panel border border-line-card bg-card px-6 py-5 text-sm text-pretty">
        <p>
          {rich("Press {strong} to look for startups. Dossier reads YC startups' job posts and this month's “Who is hiring?” thread on Hacker News, keeps the ones that hire where you live or remotely, and looks on the best matches' own sites for the address they publish for applications, following their robots.txt.", { strong: <strong>{t("Refresh")}</strong> })}
        </p>
        <p className="text-muted">
          {t("After that it refreshes once a day while you use this screen. Nothing is sent to anyone: you decide whom to write to.")}
        </p>
      </div>
    );
  }
  const failed = lastRefresh.sources.filter((source) => source.error);
  return (
    <div className="flex flex-col gap-2 text-meta text-muted">
      <p>
        {t("Last refreshed {formatDateTime}: {lastRefresh}.", { formatDateTime: formatDateTime(new Date(lastRefresh.at), undefined, new Date(today)), lastRefresh: lastRefresh.sources
          .filter((source) => !source.error)
          .map((source) => `${STARTUP_SOURCE_INFO[source.source].name} ${source.found}`)
          .join(" · ") })}
      </p>
      {failed.length > 0 && (
        <p role="note" className="rounded-card bg-warning-surface px-4 py-2.5 text-warning">
          {t("{failed}. {failed2}The next refresh tries again.", { failed: failed.map((source) => source.error).join("; "), failed2: failed.length < lastRefresh.sources.length ? t("The other one worked. ") : "" })}
        </p>
      )}
    </div>
  );
}

function ViewTabs({ filter, counts }: { filter: StartupFilter; counts: Record<StartupStatusName, number> }) {
  return (
    <nav aria-label={t("Startups views")} className="flex flex-wrap gap-1.5">
      {VIEWS.map((view) => (
        <Link
          key={view.status}
          href={startupFilterHref({ ...filter, status: view.status })}
          aria-current={view.status === filter.status ? "page" : undefined}
          className={cn(
            "flex items-baseline gap-1.5 rounded-control border px-3 py-2 text-control",
            view.status === filter.status
              ? "border-primary bg-selected font-medium text-primary-text hover:text-primary-text"
              : "border-line-field bg-card text-ink hover:border-line-strong hover:bg-hover hover:text-ink",
          )}
        >
          {t(view.label)}
          <span className="text-xs opacity-65">{counts[view.status]}</span>
        </Link>
      ))}
    </nav>
  );
}

function Filters({ filter, city, country, onChange }: { filter: StartupFilter; city: string; country: string; onChange: (change: Partial<StartupFilter>) => void }) {
  const [q, setQ] = useState(filter.q);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onChange({ q: q.trim() });
  };
  return (
    <form
      role="search"
      aria-label={t("Filter startups")}
      onSubmit={submit}
      className="grid grid-cols-1 items-end gap-4 rounded-panel border border-line-card bg-card p-6 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
    >
      <Input label={t("Search")} value={q} placeholder={t("e.g. android, fintech, Berlin")} onChange={(event) => setQ(event.target.value)} onBlur={() => q.trim() !== filter.q && onChange({ q: q.trim() })} />
      <Select label={t("Where")} value={filter.place} onChange={(event) => onChange({ place: event.target.value as StartupFilter["place"] })}>
        <option value="any">{t("Anywhere")}</option>
        {city && <option value="city">{city}</option>}
        {country && <option value="country">{country}</option>}
        <option value="remote">{t("Remote{country}", { country: country ? t(", open to {country}", { country }) : "" })}</option>
      </Select>
      <Select label={t("Source")} value={filter.source} onChange={(event) => onChange({ source: event.target.value as StartupFilter["source"] })}>
        <option value="">{t("Both sources")}</option>
        {STARTUP_SOURCES.map((source) => (
          <option key={source} value={source}>
            {STARTUP_SOURCE_INFO[source].name}
          </option>
        ))}
      </Select>
      <Select label={t("Match")} value={String(filter.minScore)} onChange={(event) => onChange({ minScore: Number(event.target.value) })}>
        <option value="0">{t("Any")}</option>
        <option value="50">{t("50 and up")}</option>
        <option value="70">{t("70 and up")}</option>
        <option value="85">{t("85 and up")}</option>
      </Select>
      <Select label={t("Sort")} value={filter.sort} onChange={(event) => onChange({ sort: event.target.value as StartupFilter["sort"] })}>
        <option value="match">{t("Best match")}</option>
        <option value="newest">{t("Newest")}</option>
      </Select>
      <div className="sm:col-span-2 lg:col-span-5">
        <Checkbox label={t("Only ones with an address to write to")} checked={filter.withEmail} onChange={(event) => onChange({ withEmail: event.target.checked })} />
      </div>
    </form>
  );
}

function Empty({ filter }: { filter: StartupFilter }) {
  const filtered = filter.q || filter.place !== "any" || filter.source || filter.minScore > 0 || filter.withEmail;
  return (
    <p className="rounded-panel border border-dashed border-line-strong px-7 py-10 text-center text-sm text-muted">
      {filtered ? t("None match these filters. Try fewer.") : filter.status === "NEW" ? t("Nothing new to look at. The next refresh may bring more.") : t("None here yet.")}
    </p>
  );
}

/** A subject for writing from the user's own mail. */
const mailto = (email: string, company: string, headline: string) =>
  `mailto:${email}?subject=${encodeURIComponent(headline ? `${headline}, interested in joining ${company}` : `Interested in joining ${company}`)}`;

function StartupCard({ startup: initial, headline, aiReady, today }: { startup: StartupView; headline: string; aiReady: boolean; today: string }) {
  const router = useRouter();
  const [startup, setStartup] = useState(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const info = STARTUP_SOURCE_INFO[startup.source];
  const posted = postedAgo(startup.postedAt, new Date(today));
  const blocked = Boolean(startup.noApplicationsFrom);

  const move = async (status: StartupStatusName, message: string) => {
    if (busy) return;
    setBusy(status);
    const before = startup.status;
    const result = toastResult(await setStartupStatus({ id: startup.id, status }));
    setBusy(null);
    if (!result.ok) return;
    toast(message, {
      action: {
        label: t("Undo"),
        onClick: () => void setStartupStatus({ id: startup.id, status: before }).then((undone) => toastResult(undone).ok && router.refresh()),
      },
    });
    router.refresh();
  };

  const lookUp = async (people: boolean) => {
    if (busy) return;
    setBusy(people ? "people" : "emails");
    const result = toastResult(await lookUpStartupAddresses({ id: startup.id, people }));
    setBusy(null);
    if (!result.ok) return;
    const added = result.data.emails.length - startup.emails.length;
    setStartup(result.data);
    if (result.data.noApplicationsFrom) toast(t("Their site says they don't take unsolicited applications."));
    else if (added > 0) toast(tp(added, "Found {count} address on their site.", "Found {count} addresses on their site."));
    else toast(people ? t("Their site doesn't publish anyone's own address.") : t("Their site doesn't publish an address for applications. Try their careers page."));
  };

  const remove = async () => {
    setRemoving(false);
    if (toastResult(await removeStartupForGood({ id: startup.id })).ok) router.refresh();
  };

  return (
    <article aria-label={startup.company} className="flex flex-col gap-4 rounded-panel border border-line-card bg-card px-6 py-5">
      <div className="flex items-start gap-4">
        <ScoreBadge score={startup.score} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-serif text-section">{startup.company}</h3>
            <span className="rounded-full border border-line-field px-2 py-0.5 text-xs text-muted">
              {info.name} · {info.kind}
            </span>
          </div>
          <p className="text-sm text-pretty">{startup.summary}</p>
          <p className="text-meta text-muted">{[startup.location, startup.remote && !/remote/i.test(startup.location) ? t("Remote") : "", startup.stage, posted].filter(Boolean).join(" · ")}</p>
        </div>
      </div>

      {startup.roles.length > 0 && (
        <ul aria-label={t("Roles")} className="flex flex-wrap gap-1.5">
          {startup.roles.map((role) => (
            <li key={role} className="rounded-full border border-line-field bg-input px-2.5 py-1 text-xs">
              {role}
            </li>
          ))}
        </ul>
      )}

      {startup.reasons.length > 0 && <p className="text-meta text-muted">{startup.reasons.join(" · ")}</p>}

      {blocked && (
        <p role="note" className="rounded-card bg-warning-surface px-4 py-2.5 text-meta text-warning">
          {t("Their site says they don't take unsolicited applications: {noApplicationsFrom}. Apply through a posted job instead.", { noApplicationsFrom: startup.noApplicationsFrom })}
        </p>
      )}

      <Emails emails={startup.emails} company={startup.company} headline={headline} peopleChecked={Boolean(startup.peopleCheckedAt)} />

      <div className="flex flex-wrap items-center gap-2">
        {startup.applicationId ? (
          <Link href={`/applications/${startup.applicationId}`} className={buttonClassName("secondary", "sm")}>
            {t("Open the application")}
          </Link>
        ) : !blocked && aiReady ? (
          <Link href={`/new?startup=${encodeURIComponent(startup.id)}`} className={buttonClassName("primary", "sm")}>
            {t("Write to them")}
          </Link>
        ) : !blocked ? (
          <Link href="/settings?section=ai" className="text-meta text-muted underline underline-offset-2 hover:text-ink">
            {t("Choose an AI provider to write an application")}
          </Link>
        ) : null}
        {startup.website && !blocked && (
          <Button size="sm" variant="secondary" aria-disabled={busy !== null || undefined} onClick={() => void lookUp(false)}>
            {busy === "emails" ? t("Looking…") : startup.emailsCheckedAt ? t("Look on their site again") : t("Find addresses on their site")}
          </Button>
        )}
        {startup.website && !blocked && startup.emailsCheckedAt && (
          <Button size="sm" variant="text" aria-disabled={busy !== null || undefined} onClick={() => void lookUp(true)}>
            {busy === "people" ? t("Looking…") : t("Look for people's addresses")}
          </Button>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-3">
          {startup.status !== "SAVED" && startup.status !== "CONTACTED" && startup.status !== "DISMISSED" && (
            <Button size="sm" variant="secondary" aria-disabled={busy !== null || undefined} onClick={() => void move("SAVED", `Saved ${startup.company}.`)}>
              {t("Save")}
            </Button>
          )}
          {startup.status !== "CONTACTED" && startup.status !== "DISMISSED" && (
            <Button size="sm" variant="text" aria-disabled={busy !== null || undefined} onClick={() => void move("CONTACTED", `Marked ${startup.company} as contacted.`)}>
              {t("Mark as contacted")}
            </Button>
          )}
          {startup.status === "DISMISSED" || startup.status === "CONTACTED" ? (
            <Button size="sm" variant="text" onClick={() => void move("NEW", `${startup.company} is back in To look at.`)}>
              {t("Move back")}
            </Button>
          ) : (
            <Button size="sm" variant="danger-text" onClick={() => void move("DISMISSED", `Dismissed ${startup.company}.`)}>
              {t("Dismiss")}
            </Button>
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-meta">
        {startup.links.map((link) => (
          <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-2 hover:text-ink">
            {t(link.label)} ↗
          </a>
        ))}
        <span className="ml-auto flex items-center gap-4">
          <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="text-muted underline underline-offset-2 hover:text-ink">
            {open ? t("Hide details") : t("Details and notes")}
          </button>
          <Button size="sm" variant="danger-text" onClick={() => setRemoving(true)}>
            {t("Remove for good")}
          </Button>
        </span>
      </div>
      {open && (
        <div className="flex flex-col gap-4">
          {startup.details && startup.details !== startup.summary && <p className="max-h-80 overflow-y-auto text-sm whitespace-pre-wrap text-document">{startup.details}</p>}
          <Notes id={startup.id} initial={startup.notes} />
        </div>
      )}
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={t("Remove {company} for good?", { company: startup.company })}
        description={t("Dossier deletes what it keeps about this startup, its addresses and your notes, and refreshes leave it out from now on. An application you started stays.")}
        confirmLabel={t("Remove for good")}
        onConfirm={() => void remove()}
      />
    </article>
  );
}

function Notes({ id, initial }: { id: string; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const save = async () => {
    if (notes === saved) return;
    if (toastResult(await saveStartupNotes({ id, notes })).ok) setSaved(notes);
  };
  return <Textarea label={t("Notes")} rows={3} value={notes} maxLength={5_000} onChange={(event) => setNotes(event.target.value)} onBlur={() => void save()} />;
}

function Emails({ emails, company, headline, peopleChecked }: { emails: StartupEmail[]; company: string; headline: string; peopleChecked: boolean }) {
  if (emails.length === 0) return null;
  const copy = (email: string) =>
    void navigator.clipboard.writeText(email).then(
      () => toast(t("Copied {email}.", { email })),
      () => toast(t("Couldn't copy it. Select the address instead.")),
    );
  return (
    <div className="flex flex-col gap-1.5">
      <ul aria-label={t("Addresses they publish")} className="flex flex-col gap-1.5">
        {emails.map((entry) => (
          <li key={entry.email} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="w-20 text-meta text-muted">{t(entry.label)}</span>
            <a href={mailto(entry.email, company, headline)} className="font-medium underline underline-offset-2">
              {entry.email}
            </a>
            <button type="button" onClick={() => copy(entry.email)} className="text-meta text-muted underline underline-offset-2 hover:text-ink">
              {t("Copy")}
            </button>
            {/^https?:\/\//.test(entry.from) && (
              <a href={entry.from} target="_blank" rel="noopener noreferrer" className="text-meta text-muted hover:text-ink">
                {t("where it's published ↗")}
              </a>
            )}
          </li>
        ))}
      </ul>
      {peopleChecked && emails.some((entry) => entry.onRequest) && (
        <p className="text-meta text-muted">{t("People's own addresses are dropped after 14 days unless you write to this startup.")}</p>
      )}
    </div>
  );
}
