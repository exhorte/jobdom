"use client";

import { useMemo } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave } from "@/hooks/use-autosave";
import { formatDateRange, type EntryOrder, type ExperienceItem, type ProfileData } from "@/lib/profile";

import {
  attachNewSkill,
  createExperience,
  removeExperience,
  reorderEntries,
  restoreExperience,
  saveExperience,
  setExperienceSkill,
  sortEntriesByDate,
} from "./actions";
import { EntryList } from "./entry-list";
import { MonthYearField } from "./month-year-field";
import { useTrackSave } from "@/components/save-tracker";
import { t } from "@/lib/i18n";
import type { UpdateProfile } from "./skills-section";
import { SkillsUsed } from "./skills-used";

/** The fields of an open role, autosaved as you type. */
function ExperienceForm({
  entry,
  onChange,
  autoFocus,
}: {
  entry: ExperienceItem;
  onChange: (entry: ExperienceItem) => void;
  autoFocus: boolean;
}) {
  const track = useTrackSave();
  // Autosave the text and dates only; skill links save on their own when toggled.
  const { id, role, company, location, bullets, startYear, startMonth, endYear, endMonth, current } = entry;
  const fields = useMemo(
    () => ({ id, role, company, location, bullets, startYear, startMonth, endYear, endMonth, current }),
    [id, role, company, location, bullets, startYear, startMonth, endYear, endMonth, current],
  );
  const { flush } = useAutosave(fields, (value) => track(saveExperience(value)));
  const set = (change: Partial<ExperienceItem>) => onChange({ ...entry, ...change });

  return (
    <div className="grid grid-cols-2 gap-[18px]" onBlur={flush}>
      <Input
        className="col-span-2"
        label={t("Role")}
        placeholder={t("Product Designer")}
        value={entry.role}
        onChange={(event) => set({ role: event.target.value })}
        autoFocus={autoFocus}
      />
      <Input
        label={t("Company")}
        placeholder={t("Acme Inc.")}
        value={entry.company}
        onChange={(event) => set({ company: event.target.value })}
      />
      <Input
        label={t("Location")}
        placeholder={t("Springfield")}
        value={entry.location}
        onChange={(event) => set({ location: event.target.value })}
      />
      <MonthYearField
        label={t("Started")}
        value={{ month: entry.startMonth, year: entry.startYear }}
        onChange={({ month, year }) => set({ startMonth: month, startYear: year })}
      />
      <div className="flex flex-col gap-2.5">
        <MonthYearField
          label={t("Ended")}
          value={{ month: entry.endMonth, year: entry.endYear }}
          onChange={({ month, year }) => set({ endMonth: month, endYear: year })}
          disabled={entry.current}
        />
        <Checkbox
          label={t("I still work here")}
          checked={entry.current}
          onChange={(event) => set({ current: event.target.checked })}
        />
      </div>
      <Textarea
        className="col-span-2"
        label={t("What you did")}
        placeholder={t("One point per line. Rough is fine.")}
        rows={4}
        value={entry.bullets}
        onChange={(event) => set({ bullets: event.target.value })}
      />
    </div>
  );
}

const roleTitle = (entry: ExperienceItem) => entry.role.trim() || t("New role");

/** Work experience (PRO-5): one card open at a time, autosaved, with Undo on Remove. */
export function ExperienceSection({ profile, update, order }: { profile: ProfileData; update: UpdateProfile; order: EntryOrder }) {
  const skillNames = (entry: ExperienceItem) =>
    profile.skills.filter((skill) => entry.skillIds.includes(skill.id)).map((skill) => skill.name);

  return (
    <EntryList
      items={profile.experience}
      setItems={(change) => update((current) => ({ ...current, experience: change(current.experience) }))}
      addLabel={t("Add a role")}
      ordering={{
        mode: order,
        save: (ids) => reorderEntries({ section: "experience", ids }),
        sortByDate: () => sortEntriesByDate({ section: "experience" }),
      }}
      summary={(entry) => ({
        title: roleTitle(entry),
        subtitle: [entry.company, entry.location].filter((part) => part.trim()).join(" · "),
        meta: formatDateRange(entry),
        footnote: skillNames(entry).join(" · ") || undefined,
      })}
      create={() => createExperience({})}
      remove={(entry) => removeExperience({ id: entry.id })}
      restore={(entry) => restoreExperience(entry)}
      renderForm={(entry, { onChange, autoFocus }) => (
        <>
          <ExperienceForm entry={entry} onChange={onChange} autoFocus={autoFocus} />
          <SkillsUsed
            entry={entry}
            noun={t("role")}
            skills={profile.skills}
            update={update}
            setLinks={(change) =>
              update((current) => ({
                ...current,
                experience: current.experience.map((item) => (item.id === entry.id ? { ...item, skillIds: change(item.skillIds) } : item)),
              }))
            }
            attach={(skillId, attached) => setExperienceSkill({ experienceId: entry.id, skillId, attached })}
            attachNew={(name) => attachNewSkill({ experienceId: entry.id, name })}
          />
        </>
      )}
    />
  );
}
