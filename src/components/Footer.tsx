import Link from "next/link";
import { STORE } from "@/lib/config";
import { getDictionary, localePath, shippingText, type Locale } from "@/i18n";
import { categoryName, type Category } from "@/lib/products";
import { StarMotif } from "./Icons";

export default function Footer({ locale, categories, comingSoon = [] }: { locale: Locale; categories: Category[]; comingSoon?: string[] }) {
  const t = getDictionary(locale);
  const f = t.footer;
  const s = shippingText(locale);
  return (
    <footer className="mt-20 bg-ink text-ivory/80 md:mt-32">
      <div className="mx-auto max-w-7xl px-5 pb-28 pt-16 md:px-10 md:py-20">
        <div className="flex flex-col items-center text-center">
          <StarMotif className="h-6 w-6 text-gold" />
          <p className="mt-6 font-serif text-4xl tracking-[0.38em] ps-[0.38em] text-ivory keep-tracking" dir="ltr">{STORE.name}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ivory/60">
            {f.about}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-ivory/10 pt-10 text-sm md:mt-16 md:pt-14 lg:grid-cols-4">
          <div>
            <p className="eyebrow !text-gold">{f.collections}</p>
            <ul className="mt-4 space-y-2">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={localePath(locale, `/boutique?categorie=${c.slug}`)} className="link-underline inline-block py-1 hover:text-ivory">
                    {categoryName(c, locale)}
                  </Link>
                  {comingSoon.includes(c.slug) && <span className="ms-2 text-xs text-gold">{t.common.comingSoon}</span>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow !text-gold">{f.delivery}</p>
            <ul className="mt-4 space-y-2 text-ivory/60">
              <li>{f.codOnly}</li>
              <li>{f.localDelay(s.localCity, s.local)}</li>
              <li>{f.otherCities(s.national)}</li>
              <li>{f.freeFrom(s.free)}</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow !text-gold">{f.service}</p>
            <ul className="mt-4 space-y-2">
              <li>
                <a href={`https://wa.me/${STORE.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="link-underline inline-block py-1 hover:text-ivory">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${STORE.email}`} className="link-underline inline-block py-1 hover:text-ivory" dir="ltr">
                  {STORE.email}
                </a>
              </li>
              <li>
                <Link href={localePath(locale, "/avis")} className="link-underline inline-block py-1 hover:text-ivory">
                  {f.reviews}
                </Link>
              </li>
              <li>
                <Link href={localePath(locale, "/echange")} className="link-underline inline-block py-1 hover:text-ivory">
                  {t.exchange.link}
                </Link>
              </li>
              <li className="text-ivory/60">{f.hours}</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow !text-gold">{f.follow}</p>
            <ul className="mt-4 space-y-2">
              <li>
                <a href={STORE.instagram} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2.5 py-1 hover:text-ivory">
                  <InstagramIcon />
                  <span className="link-underline">Instagram</span>
                </a>
              </li>
              <li>
                <a href={STORE.facebook} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2.5 py-1 hover:text-ivory">
                  <FacebookIcon />
                  <span className="link-underline">Facebook</span>
                </a>
              </li>
              <li className="text-ivory/60">{f.freeExchange}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ivory/10 pt-8 text-center md:mt-16 text-[0.65rem] uppercase tracking-[0.22em] text-ivory/40 md:flex-row">
          <p>© {new Date().getFullYear()} {STORE.name} · {t.common.country}</p>
          <p>{f.bottomRight}</p>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" />
    </svg>
  );
}
