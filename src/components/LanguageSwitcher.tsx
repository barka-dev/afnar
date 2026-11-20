"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES, LOCALE_COOKIE, LOCALE_META, switchLocalePath, type Locale } from "@/i18n/config";

/** FR | ع toggle. Keeps the current page, query string and hash; remembers the choice in a cookie. */
export default function LanguageSwitcher({ className = "", large = false }: { className?: string; large?: boolean }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const [suffix, setSuffix] = useState("");

  // Query/hash are only known on the client; read them after mount to avoid a hydration mismatch.
  useEffect(() => {
    const update = () => setSuffix(window.location.search + window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [pathname]);

  const remember = (l: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div className={`flex items-center ${large ? "gap-2" : "gap-1"} ${className}`} role="group" aria-label={t.common.language}>
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && !large && <span className="text-stone">|</span>}
          {l === locale ? (
            <span
              aria-current="true"
              lang={LOCALE_META[l].htmlLang}
              className={`inline-flex min-h-11 min-w-8 items-center justify-center text-ink ${large ? "border border-ink px-4 text-base" : "px-1 text-[0.72rem]"}`}
            >
              {large ? LOCALE_META[l].label : LOCALE_META[l].short}
            </span>
          ) : (
            <Link
              href={switchLocalePath(pathname, l) + suffix}
              onClick={() => remember(l)}
              hrefLang={LOCALE_META[l].htmlLang}
              lang={LOCALE_META[l].htmlLang}
              title={LOCALE_META[l].label}
              className={`inline-flex min-h-11 min-w-8 items-center justify-center text-muted transition-colors hover:text-ink ${large ? "border border-stone px-4 text-base" : "px-1 text-[0.72rem]"}`}
            >
              {large ? LOCALE_META[l].label : LOCALE_META[l].short}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
