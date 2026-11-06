"use client";

import { useId, useState } from "react";

import { controlBaseClassName } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { intlLocale, t } from "@/lib/i18n";

/** January… December, in the app's language (called while rendering: the language isn't known at load). */
const monthNames = (): string[] =>
  Array.from({ length: 12 }, (_, index) => {
    const name = new Intl.DateTimeFormat(intlLocale(), { month: "long", timeZone: "UTC" }).format(Date.UTC(2000, index, 1));
    return name.charAt(0).toUpperCase() + name.slice(1);
  });
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

export type MonthYear = { month: number | null; year: number | null };

/** The year typed so far, if it's a whole plausible year. */
export function parseYear(text: string): number | null {
  if (!/^\d{4}$/.test(text.trim())) return null;
  const year = Number(text.trim());
  return year >= MIN_YEAR && year <= MAX_YEAR ? year : null;
}

/**
 * A date as month (optional) and year, as decided for experience and
 * education (#36). The year only counts once it's a four-digit year; a
 * half-typed one isn't saved as something wrong.
 */
export function MonthYearField({
  label,
  value,
  onChange,
  disabled = false,
  className,
}: {
  label: string;
  value: MonthYear;
  onChange: (value: MonthYear) => void;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const [yearText, setYearText] = useState(value.year === null ? "" : String(value.year));
  const [left, setLeft] = useState(false);
  const invalid = left && yearText.trim() !== "" && parseYear(yearText) === null;
  const errorId = `${id}-error`;

  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-[7px]", className)} disabled={disabled}>
      <legend className="mb-[7px] text-label text-muted">{t(label)}</legend>
      <div className="flex gap-2">
        <select
          aria-label={t("{label} month", { label })}
          value={value.month ?? ""}
          onChange={(event) =>
            onChange({ ...value, month: event.target.value ? Number(event.target.value) : null })
          }
          className={cn(controlBaseClassName, "min-w-0 flex-1 cursor-pointer px-2.5 py-2.5")}
        >
          <option value="">{t("Month")}</option>
          {monthNames().map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
        <input
          aria-label={t("{label} year", { label })}
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          placeholder={t("Year")}
          value={yearText}
          onChange={(event) => {
            setYearText(event.target.value);
            onChange({ ...value, year: parseYear(event.target.value) });
          }}
          onBlur={() => setLeft(true)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={cn(controlBaseClassName, "w-[5.5rem] flex-none px-3 py-[11px] tabular-nums")}
        />
      </div>
      {invalid && (
        <p id={errorId} role="alert" className="text-label text-error">
          {t("Enter a four-digit year, like 2021.")}
        </p>
      )}
    </fieldset>
  );
}
