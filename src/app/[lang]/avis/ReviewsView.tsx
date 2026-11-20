"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { formatRating } from "@/i18n";
import { STORE } from "@/lib/config";
import { hasPhotos, hasText, hasVoice, reviewStats, type Review } from "@/lib/reviews";
import { StarMotif, WhatsAppIcon } from "@/components/Icons";
import Stars from "@/components/reviews/Stars";
import ReviewCard from "@/components/reviews/ReviewCard";
import PhotoLightbox from "@/components/reviews/PhotoLightbox";

type Filter = "all" | "photos" | "voice" | "text";
const PAGE = 12;

const MATCH: Record<Filter, (r: Review) => boolean> = {
  all: () => true,
  photos: hasPhotos,
  voice: hasVoice,
  text: hasText,
};

export default function ReviewsView({ reviews }: { reviews: Review[] }) {
  const { t } = useI18n();
  const tr = t.reviews;
  const stats = useMemo(() => reviewStats(reviews), [reviews]);
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE);
  const [viewer, setViewer] = useState<{ id: string; index: number } | null>(null);

  const list = useMemo(() => reviews.filter(MATCH[filter]), [reviews, filter]);
  const counts = useMemo(
    () => Object.fromEntries((Object.keys(MATCH) as Filter[]).map((f) => [f, reviews.filter(MATCH[f]).length])) as Record<Filter, number>,
    [reviews]
  );
  const open = viewer ? reviews.find((r) => r.id === viewer.id) : undefined;
  const waText = encodeURIComponent(tr.whatsappMessage(STORE.name));

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-5 md:px-10 md:pt-16">
      {/* —— Title and rating summary —— */}
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
        <div className="max-w-2xl">
          <p className="eyebrow">{tr.eyebrow}</p>
          <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.05] sm:text-5xl md:text-6xl">{tr.title}</h1>
          <p className="mt-5 max-w-xl leading-relaxed text-muted">{tr.intro}</p>
        </div>

        {stats.count > 0 && (
          <div className="flex flex-col gap-6 border border-stone/70 bg-sand/50 p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6 lg:min-w-[26rem]">
            <div className="shrink-0 text-center sm:text-start">
              <p className="font-serif text-6xl leading-none">
                {formatRating(stats.average)}
                <span className="ms-2 font-sans text-sm text-muted">{tr.outOf5}</span>
              </p>
              <div className="mt-3 flex justify-center sm:justify-start">
                <Stars value={stats.average} label={tr.starsAria(Number(stats.average.toFixed(1)))} className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">{tr.count(stats.count)}</p>
            </div>
            <div className="flex-1">
              <ul className="space-y-1.5">
                {stats.byStars.map(({ stars, count }) => (
                  <li key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-14 shrink-0 text-muted">{tr.starsRow(stars)}</span>
                    <span className="relative h-1 flex-1 overflow-hidden bg-stone/70" aria-hidden>
                      <span className="absolute inset-y-0 start-0 bg-gold" style={{ width: `${stats.count ? (count / stats.count) * 100 : 0}%` }} />
                    </span>
                    <span className="w-5 shrink-0 text-end tabular-nums text-muted">{count}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted">
                {tr.withPhotos(stats.photos)} · {tr.withVoice(stats.voice)}
              </p>
            </div>
          </div>
        )}
      </div>


      {stats.count === 0 ? (
        <div className="mt-14 border-t border-stone/70 pt-14 text-center">
          <StarMotif className="mx-auto h-6 w-6 text-gold" />
          <p className="mt-5 font-serif text-3xl">{tr.emptyTitle}</p>
          <p className="mt-2 text-muted">{tr.emptyText}</p>
        </div>
      ) : (
        <>
          {/* —— Filters —— */}
          <div
            role="group"
            aria-label={tr.filterAria}
            className="no-scrollbar -mx-4 mt-10 flex gap-2 overflow-x-auto border-y border-stone/70 px-4 py-4 sm:mx-0 sm:px-0 md:mt-14"
          >
            {(Object.keys(MATCH) as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                disabled={counts[f] === 0}
                onClick={() => {
                  setFilter(f);
                  setShown(PAGE);
                }}
                className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-stone px-4 text-xs uppercase tracking-[0.18em] transition-colors duration-300 hover:border-ink disabled:pointer-events-none disabled:opacity-40 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-ivory"
              >
                <FilterIcon filter={f} />
                {tr.filters[f]}
                <span className="tabular-nums opacity-60">{counts[f]}</span>
              </button>
            ))}
          </div>

          {/* —— Reviews (masonry) —— */}
          <div className="mt-8 columns-1 gap-5 sm:columns-2 sm:gap-6 lg:columns-3" aria-live="polite">
            {list.slice(0, shown).map((r) => (
              <ReviewCard key={r.id} review={r} onOpenPhoto={(index) => setViewer({ id: r.id, index })} />
            ))}
          </div>
          {list.length === 0 && <p className="py-16 text-center text-muted">{tr.none}</p>}

          {list.length > shown && (
            <div className="mt-6 text-center">
              <button type="button" onClick={() => setShown((s) => s + PAGE)} className="btn btn-outline">
                {tr.more}
              </button>
            </div>
          )}
        </>
      )}

      {/* —— Leave a review —— */}
      <section className="mt-16 flex flex-col items-center bg-ink px-6 py-12 text-center text-ivory sm:px-10 md:mt-24 md:py-16">
        <p className="eyebrow !text-gold">{tr.ctaEyebrow}</p>
        <h2 className="mt-4 font-serif text-3xl sm:text-4xl">{tr.ctaTitle}</h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ivory/70">{tr.ctaText}</p>
        <a
          href={`https://wa.me/${STORE.whatsappNumber}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-light mt-8"
        >
          <WhatsAppIcon className="h-4 w-4" /> {tr.ctaButton}
        </a>
      </section>

      {open?.photos && viewer && (
        <PhotoLightbox
          photos={open.photos}
          index={viewer.index}
          name={open.name}
          onIndex={(index) => setViewer({ id: open.id, index })}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}

function FilterIcon({ filter }: { filter: Filter }) {
  const p = { viewBox: "0 0 24 24", className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
  if (filter === "photos")
    return (
      <svg {...p}>
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
      </svg>
    );
  if (filter === "voice")
    return (
      <svg {...p}>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
      </svg>
    );
  if (filter === "text")
    return (
      <svg {...p}>
        <path d="M4 6h16M4 11h16M4 16h10" />
      </svg>
    );
  return null;
}
