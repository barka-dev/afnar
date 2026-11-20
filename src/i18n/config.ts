export const LOCALES = ["fr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "afnar-locale";

export const LOCALE_META: Record<Locale, { label: string; short: string; dir: "ltr" | "rtl"; htmlLang: string; og: string }> = {
  fr: { label: "Français", short: "FR", dir: "ltr", htmlLang: "fr-MA", og: "fr_MA" },
  ar: { label: "العربية", short: "ع", dir: "rtl", htmlLang: "ar-MA", og: "ar_MA" },
};

export const hasLocale = (value: string | undefined | null): value is Locale =>
  !!value && (LOCALES as readonly string[]).includes(value);

/** Prefixes an internal path with the locale: ("/boutique", "ar") -> "/ar/boutique". Keeps query and hash. */
export function localePath(locale: Locale, path: string = "/"): string {
  if (path === "/" || path === "") return `/${locale}`;
  if (path.startsWith("/#") || path.startsWith("/?")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Swaps the locale prefix of a pathname: ("/fr/boutique", "ar") -> "/ar/boutique". */
export function switchLocalePath(pathname: string, locale: Locale): string {
  const parts = pathname.split("/");
  if (hasLocale(parts[1])) parts[1] = locale;
  else parts.splice(1, 0, locale);
  return parts.join("/") || `/${locale}`;
}

/** Picks the best supported locale from an Accept-Language header. */
export function matchAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const best = ranked.find((r) => hasLocale(r.lang))?.lang;
  return hasLocale(best) ? best : DEFAULT_LOCALE;
}
