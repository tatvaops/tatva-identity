"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, localeLabels, type AppLocale } from "@/lib/i18n";
import { setLocale } from "@/lib/actions/growth";
import { useDictionary } from "@/components/providers/locale-provider";

export function LanguageForm({ current }: { current: AppLocale }) {
  const router = useRouter();
  const copy = useDictionary();
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-3"
      onSubmit={(event) => {
        event.preventDefault();
        const locale = String(new FormData(event.currentTarget).get("locale") ?? "en");
        start(async () => {
          await setLocale(locale);
          router.refresh();
        });
      }}
    >
      <label className="block text-sm">
        <span className="font-medium">{copy.language}</span>
        <select
          name="locale"
          defaultValue={current}
          className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
        >
          {LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {localeLabels[locale]}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className="mt-3 h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white">
        Save language
      </button>
    </form>
  );
}
