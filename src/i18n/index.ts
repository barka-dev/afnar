import type { Dictionary } from "./dictionaries/types";
import ar from "./dictionaries/ar";
import { SHIPPING } from "@/lib/config";
import { cityLabel } from "@/lib/cities";
import { LOCALES, LOCALE_META, localePath, type Locale } from "./config";

export type { Dictionary };
export * from "./config";

const DICTIONARIES: Record<Locale, Dictionary> = { ar };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** 1290 -> "1 290 DH" / "1 290 درهم" (deterministic on server and client) */
export function formatPrice(value: number, locale: Locale): string {
  const rounded = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${rounded} ${DICTIONARIES[locale].common.currency}`;
}

/** "2026-11-08" -> "8 novembre 2026" / "8 نونبر 2026" (deterministic on server and client) */
export function formatDate(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${DICTIONARIES[locale].reviews.months[m - 1]} ${y}`;
}

/** 4.666 -> "4,7" */
export const formatRating = (value: number) => value.toFixed(1).replace(".", ",");

/** Localised delivery delays and the local city name, for interpolation in dictionary strings. */
export function shippingText(locale: Locale) {
  const t = DICTIONARIES[locale];
  return {
    local: t.shipping.hours(SHIPPING.delayLocalHours),
    national: t.shipping.hoursRange(...SHIPPING.delayNationalHours),
    free: formatPrice(SHIPPING.freeThreshold, locale),
    localCity: cityLabel(SHIPPING.localCity, locale),
  };
}

/** SEO: canonical URL for this page plus its equivalent in every language (hreflang). */
export function alternates(locale: Locale, path: string = "/") {
  return {
    canonical: localePath(locale, path),
    languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_META[l].htmlLang, localePath(l, path)])),
  };
}

export function deliveryDelay(city: string, locale: Locale): string {
  const s = shippingText(locale);
  return city === SHIPPING.localCity ? s.local : s.national;
}
