import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternates, getDictionary, hasLocale } from "@/i18n";
import { EXCHANGE, STORE } from "@/lib/config";
import { CheckIcon, CloseIcon, ExchangeIcon, StarMotif, WhatsAppIcon } from "@/components/Icons";

export async function generateMetadata({ params }: PageProps<"/[lang]/echange">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.meta.exchangeTitle, description: t.meta.exchangeDescription, alternates: alternates(lang, "/echange") };
}

export default async function ExchangePolicyPage({ params }: PageProps<"/[lang]/echange">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const x = getDictionary(lang).exchange;
  const wa = `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(x.whatsappMessage(STORE.name))}`;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-5 md:px-10 md:pt-16">
      {/* —— Title —— */}
      <header className="max-w-2xl">
        <p className="eyebrow">{x.eyebrow}</p>
        <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.05] sm:text-5xl md:text-6xl">{x.title}</h1>
        <p className="mt-5 max-w-xl leading-relaxed text-muted">{x.intro(EXCHANGE.days)}</p>
        <p className="mt-3 text-xs text-muted">{x.updated}</p>
      </header>

      {/* —— Key facts —— */}
      <ul className="mt-10 grid border-y border-stone/70 sm:grid-cols-3 md:mt-14">
        {x.facts(EXCHANGE.days).map(([big, small], i) => (
          <li key={big} className={`py-5 sm:px-6 sm:py-7 sm:text-center ${i > 0 ? "border-t border-stone/70 sm:border-s sm:border-t-0" : ""}`}>
            <p className="font-serif text-3xl leading-none md:text-4xl">{big}</p>
            <p className="mt-2 text-sm text-muted">{small}</p>
          </li>
        ))}
      </ul>

      {/* —— Accepted / refused —— */}
      <div className="mt-14 grid gap-6 md:mt-20 md:grid-cols-2 md:gap-8">
        <section className="border border-stone/70 bg-white/60 p-5 sm:p-7">
          <h2 className="font-serif text-2xl md:text-3xl">{x.acceptedTitle}</h2>
          <ul className="mt-6 space-y-5">
            {x.accepted(EXCHANGE.days).map(([title, text]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-stone/70 bg-sand/50 p-5 sm:p-7">
          <h2 className="font-serif text-2xl md:text-3xl">{x.refusedTitle}</h2>
          <ul className="mt-6 space-y-4">
            {x.refused(EXCHANGE.days).map((text) => (
              <li key={text} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-sold ring-1 ring-inset ring-red-200">
                  <CloseIcon className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-7 border-t border-stone/70 pt-5 text-sm leading-relaxed text-muted">{x.inspection}</p>
        </section>
      </div>

      {/* —— Defect —— */}
      <section className="mt-6 flex gap-4 border-s-2 border-gold bg-white/60 p-5 sm:p-7 md:mt-8">
        <StarMotif className="mt-1 h-5 w-5 shrink-0 text-gold" />
        <div>
          <h2 className="font-serif text-2xl">{x.defectTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{x.defectText(EXCHANGE.defectHours)}</p>
        </div>
      </section>

      {/* —— How to —— */}
      <section className="mt-14 md:mt-20">
        <h2 className="font-serif text-3xl md:text-4xl">{x.stepsTitle}</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {x.steps.map(([title, text], i) => (
            <li key={title} className="border-t border-stone/70 pt-5">
              <p className="font-serif text-4xl font-light leading-none text-gold" dir="ltr">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-4 text-[0.7rem] uppercase tracking-[0.2em]">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* —— Fees —— */}
      <section className="mt-14 md:mt-20">
        <h2 className="font-serif text-3xl md:text-4xl">{x.feesTitle}</h2>
        <dl className="mt-6 divide-y divide-stone/70 border-y border-stone/70">
          {x.fees.map(([term, text]) => (
            <div key={term} className="grid gap-1 py-4 sm:grid-cols-[16rem_1fr] sm:gap-6">
              <dt className="font-medium">{term}</dt>
              <dd className="text-sm leading-relaxed text-muted sm:text-base">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* —— CTA —— */}
      <section className="mt-14 bg-ink px-6 py-12 text-center text-ivory md:mt-20 md:py-16">
        <ExchangeIcon className="mx-auto h-7 w-7 text-gold" />
        <h2 className="mt-4 font-serif text-3xl font-light md:text-4xl">{x.ctaTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ivory/60">{x.ctaText}</p>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-light mt-8">
          <WhatsAppIcon className="h-4 w-4" /> {x.ctaButton}
        </a>
      </section>
    </div>
  );
}
