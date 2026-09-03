"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getDictionary, parseLocale, type AppLocale } from "@/lib/i18n";

const LocaleContext = createContext<AppLocale>("en");

export function LocaleProvider({ locale, children }: { locale: AppLocale; children: ReactNode }) {
  return <LocaleContext.Provider value={parseLocale(locale)}>{children}</LocaleContext.Provider>;
}

export function useDictionary() {
  return getDictionary(useContext(LocaleContext));
}
