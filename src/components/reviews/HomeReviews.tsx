"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { formatRating } from "@/i18n";
import { hasPhotos, hasText, hasVoice, reviewStats, type Review } from "@/lib/reviews";
import { ArrowIcon } from "@/components/Icons";
import Reveal from "@/components/Reveal";
import Stars from "./Stars";
import ReviewCard from "./ReviewCard";
import PhotoLightbox from "./PhotoLightbox";

const SHOW = 3;

/** Picks a varied selection — one with photos, one voice note, one written — then fills with the newest. */
function pick(reviews: Review[]): Review[] {
  const chosen: Review[] = [];
  const add = (r?: Review) => r && !chosen.includes(r) && chosen.push(r);
  add(reviews.find(hasPhotos));
  add(reviews.find((r) => hasVoice(r) && !chosen.includes(r)));
  add(reviews.find((r) => hasText(r) && !hasPhotos(r) && !hasVoice(r)));
  for (const r of reviews) if (chosen.length < SHOW) add(r);
  // keep newest first
  return chosen.slice(0, SHOW).sort((a, b) => b.date.localeCompare(a.date));
}

/** Short "Avis" section on the home page. Renders nothing until there are reviews. */
export default function HomeReviews({ reviews }: { reviews: Review[] }) {
  const { t, href } = useI18n();
  const h = t.home;
  const tr = t.reviews;
  const stats = useMemo(() => reviewStats(reviews), [reviews]);
  const shown = useMemo(() => pick(reviews), [reviews]);
  const [viewer, setViewer] = useState<{ id: string; index: number } | null>(null);
  const open = viewer ? shown.find((r) => r.id === viewer.id) : undefined;

  if (shown.length === 0) return null;

  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-5 md:mt-32 md:px-10">
      <Reveal className="flex flex-col items-start justify-between gap-5 sm:gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">{tr.eyebrow}</p>
          <h2 className="mt-4 font-serif text-4xl font-light md:text-5xl">{h.reviewsTitle}</h2>
          <div className="mt-4 flex items-center gap-3">
            <Stars value={stats.average} label={tr.starsAria(Number(stats.average.toFixed(1)))} className="h-4 w-4" />
            <p className="text-sm text-muted">
              <span className="text-ink">{formatRating(stats.average)}</span> {tr.outOf5} · {tr.count(stats.count)}
            </p>
          </div>
        </div>
        <Link href={href("/avis")} className="link-underline inline-flex items-center gap-2 py-1 text-[0.68rem] uppercase tracking-[0.24em]">
          {h.reviewsAll} <ArrowIcon className="h-3.5 w-3.5 rtl:-scale-x-100" />
        </Link>
      </Reveal>

      {/* Swipeable row on phones, three columns from tablets */}
      <div className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-2 sm:-mx-5 sm:px-5 md:mx-0 md:mt-14 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 [&_article]:mb-0">
        {shown.map((r) => (
          <div key={r.id} className="w-[85%] max-w-sm shrink-0 snap-center sm:w-[60%] md:w-auto md:max-w-none">
            <ReviewCard review={r} onOpenPhoto={(index) => setViewer({ id: r.id, index })} />
          </div>
        ))}
      </div>

      {open?.photos && viewer && (
        <PhotoLightbox
          photos={open.photos}
          index={viewer.index}
          name={open.name}
          onIndex={(index) => setViewer({ id: open.id, index })}
          onClose={() => setViewer(null)}
        />
      )}
    </section>
  );
}
