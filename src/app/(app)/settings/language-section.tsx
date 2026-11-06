"use client";

import { useState } from "react";

import { useTrackSave } from "@/components/save-tracker";
import { toastResult } from "@/components/toast";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { LOCALE_NAMES, LOCALES, t, type Locale } from "@/lib/i18n";

import { updateSettings } from "./actions";
import { SettingsSectionIntro } from "./settings-screen";

/**
 * Settings → Language: the language of the app's words, French or English.
 * The choice saves at once and the page loads again, so every word on every
 * screen changes together. Documents have their own language (Documents).
 */
export function LanguageSection({ initial }: { initial: Locale }) {
  const track = useTrackSave();
  const [locale, setLocale] = useState(initial);

  const change = async (next: Locale) => {
    const previous = locale;
    setLocale(next);
    const result = toastResult(await track(updateSettings({ locale: next })));
    if (!result.ok) {
      setLocale(previous);
      return;
    }
    window.location.reload();
  };

  return (
    <>
      <SettingsSectionIntro title={t("Language")}>
        {t("The language of the app's words. Documents are written in the language chosen in Settings → Documents.")}
      </SettingsSectionIntro>
      <Card padding="none" className="grid gap-x-[18px] gap-y-5 px-7 py-[26px] sm:grid-cols-2">
        <Select label={t("Interface language")} value={locale} onChange={(event) => void change(event.target.value as Locale)}>
          {LOCALES.map((entry) => (
            <option key={entry} value={entry}>
              {LOCALE_NAMES[entry]}
            </option>
          ))}
        </Select>
      </Card>
    </>
  );
}
