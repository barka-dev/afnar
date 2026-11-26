import Link from "next/link";
import Reveal from "@/components/Reveal";
import HeroVisual from "@/components/HeroVisual";
import ProductCard from "@/components/ProductCard";
import AbayaArt from "@/components/AbayaArt";
import { ArrowIcon, CashIcon, ChatIcon, ExchangeIcon, StarMotif, TruckIcon } from "@/components/Icons";
import Image from "next/image";
import { categoryDescription, categoryName } from "@/lib/products";
import { getCategories, getProducts, getReviews } from "@/lib/server/catalog";
import { getDictionary, hasLocale, localePath, shippingText } from "@/i18n";
import { notFound } from "next/navigation";
import HomeReviews from "@/components/reviews/HomeReviews";

const PROMISE_ICONS = [CashIcon, TruckIcon, ExchangeIcon, ChatIcon];

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const h = t.home;
  const to = (p: string) => localePath(lang, p);
  const promises = h.promises(shippingText(lang)).map((p, i) => ({ ...p, icon: PROMISE_ICONS[i] }));
  const [products, categories, reviews] = await Promise.all([getProducts(), getCategories(), getReviews()]);
  const featured = [...products].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).slice(0, 4);

  return (
    <>
      {/* ——— Hero ——— */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-8 sm:px-5 md:gap-16 md:px-10 md:pb-24 lg:grid-cols-2 lg:pt-16">
        <div className="max-w-xl">
          <p className="eyebrow animate-fade-in">{h.eyebrow}</p>
          <h1 className="mt-5 animate-fade-in font-serif text-[2.9rem] font-light leading-[1.05] sm:mt-6 sm:text-6xl md:text-7xl rtl:leading-[1.3]" style={{ animationDelay: "120ms" }}>
            {h.heroTitle1}
            <br />
            <em className="text-gold-dark">{h.heroTitle2}</em>
          </h1>
          <p className="mt-6 max-w-md animate-fade-in leading-relaxed text-muted sm:mt-8" style={{ animationDelay: "240ms" }}>
            {h.heroText}
          </p>
          <div className="mt-8 flex flex-col gap-3 animate-fade-in sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4" style={{ animationDelay: "360ms" }}>
            <Link href={to("/boutique")} className="btn btn-primary w-full sm:w-auto">
              {h.heroCta} <ArrowIcon className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
            <Link href={to("/#commander")} className="btn btn-outline w-full sm:w-auto">
              {h.heroCta2}
            </Link>
          </div>
        </div>
        <HeroVisual caption={h.heroCaption} />
      </section>

      {/* ——— Promises ——— */}
      <section className="border-y border-stone/70 bg-sand/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-2 gap-y-8 px-4 py-10 sm:gap-y-10 sm:px-5 sm:py-12 md:px-10 lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 100} className="flex flex-col items-center px-1 text-center sm:px-3">
              <Icon className="h-7 w-7 text-gold-dark" />
              <p className="mt-4 text-[0.68rem] uppercase tracking-[0.22em]">{title}</p>
              <p className="mt-2 text-sm text-muted">{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ——— Collections ——— */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-5 md:px-10 md:py-28">
        <Reveal className="text-center">
          <p className="eyebrow">{h.collectionsEyebrow}</p>
          <h2 className="mt-4 font-serif text-4xl font-light md:text-5xl">{h.collectionsTitle}</h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:mt-16 sm:gap-5 md:grid-cols-4 md:gap-8">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delay={i * 120}>
              <Link href={to(`/boutique?categorie=${c.slug}`)} className="group block text-center">
                <div className="arch relative aspect-[3/4.2] bg-sand">
                  <div className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-[1.07]">
                    {c.image ? (
                      <Image src={c.image} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
                    ) : (
                      <AbayaArt color={c.color} cut={c.cut} className="h-full w-full" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/10" />
                </div>
                <p className="mt-4 font-serif text-xl sm:mt-6 sm:text-2xl">{categoryName(c, lang)}</p>
                <p className="mt-1 text-xs text-muted">{categoryDescription(c, lang)}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.24em] text-gold-dark transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100 [@media(hover:hover)]:opacity-0 rtl:group-hover:-translate-x-1">
                  {h.explore} <ArrowIcon className="h-3 w-3 rtl:-scale-x-100" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ——— Values: one hadith on modesty, then the three values of the house ——— */}
      <section className="mb-20 bg-sand/60 md:mb-28">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-5 md:px-10 md:py-28">
          <Reveal>
            <div className="flex items-center justify-center gap-4 text-gold" aria-hidden="true">
              <span className="h-px w-16 bg-gold/60" />
              <StarMotif className="h-5 w-5" />
              <span className="h-px w-16 bg-gold/60" />
            </div>
            <blockquote className="mt-8">
              <p lang="ar" dir="rtl" className="font-serif text-[2.4rem] leading-[1.5] sm:text-5xl md:text-6xl">
                {h.values.quote}
              </p>
              <footer className="mt-2 text-xs text-muted">{h.values.source}</footer>
            </blockquote>
          </Reveal>
          <div className="mx-auto mt-14 grid max-w-5xl gap-10 text-start md:mt-16 md:grid-cols-3 md:gap-12">
            {h.values.items.map((v, i) => (
              <Reveal key={v.word} delay={i * 120}>
                <p lang="ar" dir="rtl" className="w-fit font-serif text-3xl text-gold-dark">
                  {v.word}
                </p>
                <p className="mt-1 font-serif text-2xl">{v.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Featured ——— */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-10">
        <Reveal className="flex flex-col items-start justify-between gap-4 sm:gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">{h.featuredEyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl font-light md:text-5xl">{h.featuredTitle}</h2>
          </div>
          <Link href={to("/boutique")} className="link-underline text-[0.68rem] uppercase tracking-[0.24em]">
            {h.allShop}
          </Link>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:mt-14 sm:gap-x-5 sm:gap-y-14 md:gap-x-8 lg:grid-cols-4">
          {featured.map((p, i) => (
            <Reveal key={p.slug} delay={i * 110}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ——— Maison / editorial ——— */}
      <section id="maison" className="mx-auto mt-20 grid max-w-7xl scroll-mt-24 items-center gap-10 px-4 sm:px-5 md:mt-32 md:gap-16 md:px-10 lg:grid-cols-2">
        {/* Selection criteria, in the site's arch frame */}
        <Reveal variant="clip" className="arch relative bg-sand px-6 pb-10 pt-20 sm:px-10 sm:pb-12 sm:pt-24">
          <div className="text-center">
            <StarMotif className="mx-auto h-6 w-6 text-gold" />
            <h3 className="mt-4 font-serif text-3xl font-light">{h.criteriaTitle}</h3>
          </div>
          <ul className="mt-8 sm:mt-10">
            {h.criteria.map(([title, text]) => (
              <li key={title} className="flex gap-4 border-t border-stone/70 py-5 first:border-t-0 first:pt-0 last:pb-0">
                <StarMotif className="mt-1.5 h-3.5 w-3.5 shrink-0 text-gold-dark" />
                <div>
                  <p className="font-serif text-xl">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
        <div className="max-w-lg">
          <Reveal>
            <StarMotif className="h-6 w-6 text-gold" />
            <p className="eyebrow mt-6">{h.maisonEyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl font-light leading-tight md:text-5xl">
              {h.maisonTitle1}
              <br />
              <em>{h.maisonTitle2}</em>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-8 leading-relaxed text-muted">
              {h.maisonText1}
            </p>
            <p className="mt-5 leading-relaxed text-muted">
              {h.maisonText2}
            </p>
          </Reveal>
          <Reveal delay={300} className="mt-10 grid grid-cols-3 gap-4 border-t border-stone pt-8 sm:mt-12 sm:gap-6">
            {h.stats.map(([n, l]) => (
              <div key={l}>
                <p className="font-serif text-3xl text-gold-dark sm:text-4xl">{n}</p>
                <p className="mt-1 text-xs text-muted">{l}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ——— Reviews (hidden until there are reviews) ——— */}
      <HomeReviews reviews={reviews} />

      {/* ——— How to order ——— */}
      <section id="commander" className="mt-20 scroll-mt-16 bg-ink py-20 text-ivory md:mt-32 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-10">
          <Reveal className="text-center">
            <p className="eyebrow !text-gold">{h.orderEyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl font-light md:text-5xl">{h.orderTitle}</h2>
          </Reveal>
          <div className="mt-12 grid gap-12 md:mt-20 md:grid-cols-3 md:gap-14">
            {h.steps.map(([n, title, d], i) => (
              <Reveal key={n} delay={i * 150} className="group text-center">
                <p className="font-serif text-6xl font-light text-gold transition-transform duration-700 group-hover:-translate-y-1">{n}</p>
                <div className="mx-auto my-6 h-px w-10 bg-ivory/30 transition-all duration-700 group-hover:w-20 group-hover:bg-gold" />
                <p className="text-[0.7rem] uppercase tracking-[0.24em]">{title}</p>
                <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-ivory/60">{d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={300} className="mt-14 text-center md:mt-20">
            <Link href={to("/boutique")} className="btn btn-light">
              {h.startShopping}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
