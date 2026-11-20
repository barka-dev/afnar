import Link from "next/link";
import { lang } from "next/root-params";
import { DEFAULT_LOCALE, getDictionary, hasLocale, localePath } from "@/i18n";

export default async function NotFound() {
  const value = await lang();
  const locale = hasLocale(value) ? value : DEFAULT_LOCALE;
  const t = getDictionary(locale);
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <p className="eyebrow">{t.notFound.eyebrow}</p>
      <h1 className="mt-4 font-serif text-5xl font-light">{t.notFound.title}</h1>
      <p className="mt-4 text-muted">{t.notFound.text}</p>
      <Link href={localePath(locale, "/boutique")} className="btn btn-primary mt-10">
        {t.notFound.back}
      </Link>
    </div>
  );
}
