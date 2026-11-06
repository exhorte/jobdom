"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { t } from "@/lib/i18n";
import type { Country } from "@/lib/job-search/countries";
import { POSTED_WITHIN, RADII_KM, type JobSource, type RadiusKm, type SearchQuery } from "@/lib/job-search/search";
import { SOURCE_INFO, sourceCovers } from "@/lib/job-search/sources";

// A search's fields, as Find jobs asks them (E14-6) and Settings → Job agent
// saves its search (E16-7).

export type SearchFieldErrors = { keywords?: string; country?: string };

/** Why `source` can't search the country, in words, or undefined. */
export function uncoveredCountry(source: JobSource | null, query: SearchQuery, countries: readonly Country[]): string | undefined {
  if (!source || !query.country || sourceCovers(source, query.country)) return undefined;
  const name = countries.find((country) => country.code === query.country)?.name ?? query.country.toUpperCase();
  return t("{name} doesn't list jobs in {name2}.", { name: SOURCE_INFO[source].name, name2: name });
}

/** What, Where, Country, Within and Posted, for a grid; Remote only is RemoteOnlyField. */
export function SearchFields({
  value,
  onChange,
  source,
  countries,
  errors = {},
  onBlur,
}: {
  value: SearchQuery;
  onChange: (patch: Partial<SearchQuery>) => void;
  source: JobSource | null;
  countries: readonly Country[];
  errors?: SearchFieldErrors;
  /** For text fields that save once typing is done. */
  onBlur?: () => void;
}) {
  const uncovered = uncoveredCountry(source, value, countries);
  return (
    <>
      <Input
        label={t("What")}
        className="sm:col-span-2 lg:col-span-1"
        value={value.keywords}
        placeholder={t("Job title, skill or company")}
        error={errors.keywords}
        onChange={(event) => onChange({ keywords: event.target.value })}
        onBlur={onBlur}
      />
      <Input label={t("Where")} value={value.place} placeholder={t("City or region")} onChange={(event) => onChange({ place: event.target.value })} onBlur={onBlur} />
      <Select label={t("Country")} value={value.country} error={errors.country ?? uncovered} onChange={(event) => onChange({ country: event.target.value })}>
        <option value="">{t("Choose a country")}</option>
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </Select>
      <Select
        label={t("Within")}
        value={String(value.radiusKm)}
        disabled={!value.place.trim()}
        hint={value.place.trim() ? undefined : t("Add a place first")}
        onChange={(event) => onChange({ radiusKm: Number(event.target.value) as RadiusKm })}
      >
        {RADII_KM.map((km) => (
          <option key={km} value={km}>
            {t("{km} km", { km })}
          </option>
        ))}
      </Select>
      <Select label={t("Posted")} value={value.postedWithin} onChange={(event) => onChange({ postedWithin: event.target.value as SearchQuery["postedWithin"] })}>
        {POSTED_WITHIN.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.label)}
          </option>
        ))}
      </Select>
    </>
  );
}

/** "Remote only", with what it means on Adzuna, which has no such filter. */
export function RemoteOnlyField({ value, onChange, source }: { value: SearchQuery; onChange: (patch: Partial<SearchQuery>) => void; source: JobSource | null }) {
  return (
    <Checkbox
      label={t("Remote only")}
      checked={value.remoteOnly}
      onChange={(event) => onChange({ remoteOnly: event.target.checked })}
      hint={source === "ADZUNA" && value.remoteOnly ? t("Adzuna has no remote filter, so this adds “remote” to your search.") : undefined}
    />
  );
}
