"use client";

import { createContext, useContext, useMemo } from "react";
import { getDictionary, formatPrice, localePath, LOCALE_META, type Dictionary, type Locale } from "./index";

interface I18nValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Dictionary;
  /** Locale-aware price, e.g. "690 DH" / "690 درهم" */
  price: (value: number) => string;
  /** Prefix an internal path with the current locale */
  href: (path: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dir: LOCALE_META[locale].dir,
      t: getDictionary(locale),
      price: (v) => formatPrice(v, locale),
      href: (p) => localePath(locale, p),
    }),
    [locale]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
