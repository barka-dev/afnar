/**
 * The shop speaks Arabic only, at clean addresses (/boutique). In the code, pages still live in the [lang]
 * route segment with the single locale "ar": src/proxy.ts rewrites /boutique to /ar/boutique internally,
 * and redirects old /ar/... and /fr/... links to the clean address.
 */
export const LOCALES = ["ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";

export const LOCALE_META: Record<Locale, { label: string; short: string; dir: "ltr" | "rtl"; htmlLang: string; og: string }> = {
  ar: { label: "العربية", short: "ع", dir: "rtl", htmlLang: "ar-MA", og: "ar_MA" },
};

export const hasLocale = (value: string | undefined | null): value is Locale =>
  !!value && (LOCALES as readonly string[]).includes(value);

/**
 * Public address of an internal path: ("/boutique", "ar") -> "/boutique" (clean addresses, no prefix).
 * Keeps query and hash. `_locale` stays in the signature so call sites don't change.
 */
export function localePath(_locale: Locale, path: string = "/"): string {
  if (path === "") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}
