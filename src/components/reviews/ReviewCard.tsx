"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDate } from "@/i18n";
import { cityLabel } from "@/lib/cities";
import { colorLabel, productName } from "@/lib/products";
import { useCatalog } from "@/context/CatalogContext";
import { REVIEW_LANG_META, type Review } from "@/lib/reviews";
import { CheckIcon } from "@/components/Icons";
import Stars from "./Stars";
import VoiceNote from "./VoiceNote";
import ReviewPhotoView from "./ReviewPhotoView";

const MAX_THUMBS = 3;

export default function ReviewCard({ review: r, onOpenPhoto }: { review: Review; onOpenPhoto: (index: number) => void }) {
  const { t, locale, href } = useI18n();
  const tr = t.reviews;
  const meta = REVIEW_LANG_META[r.lang];
  const photos = r.photos ?? [];
  const product = useCatalog().getProduct(r.product?.slug);
  const color = product?.colors.find((c) => c.name === r.product?.color);

  return (
    <article className="mb-5 break-inside-avoid border border-stone/70 bg-ivory p-5 animate-fade-in sm:mb-6 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <Stars value={r.rating} label={tr.starsAria(r.rating)} />
        <time dateTime={r.date} className="text-[0.7rem] uppercase tracking-[0.16em] text-muted">
          {formatDate(r.date, locale)}
        </time>
      </header>

      {photos.length > 0 && (
        <div className={`mt-4 grid gap-1.5 ${photos.length === 1 ? "grid-cols-1" : photos.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {photos.slice(0, MAX_THUMBS).map((p, i) => {
            const hidden = photos.length - MAX_THUMBS;
            const isLast = i === MAX_THUMBS - 1 && hidden > 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onOpenPhoto(i)}
                aria-label={tr.openPhoto(i + 1, photos.length, r.name)}
                className={`group relative overflow-hidden bg-sand ${photos.length === 1 ? "aspect-[4/5]" : "aspect-[3/4]"}`}
              >
                <span className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.04]">
                  <ReviewPhotoView
                    photo={p}
                    alt=""
                    sizes={photos.length === 1 ? "(min-width: 1024px) 26rem, (min-width: 640px) 45vw, 90vw" : "(min-width: 1024px) 13rem, 45vw"}
                  />
                </span>
                {isLast && (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/55 font-serif text-3xl text-ivory">
                    {tr.morePhotos(hidden)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {r.text && (
        <p lang={meta.htmlLang} dir={meta.dir} className="mt-4 whitespace-pre-line font-serif text-[1.2rem] leading-snug text-ink">
          {r.text}
        </p>
      )}

      {r.voice && (
        <div className="mt-4">
          <p className="mb-2 text-[0.65rem] uppercase tracking-[0.22em] text-gold-dark">{tr.voiceNote}</p>
          <VoiceNote voice={r.voice} id={r.id} lang={r.lang} />
        </div>
      )}

      <footer className="mt-5 border-t border-stone/60 pt-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p>
            <span dir="auto" className="font-normal">
              {r.name}
            </span>
            <span className="text-muted"> · {cityLabel(r.city, locale)}</span>
          </p>
          {r.verified && (
            <span className="flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.18em] text-gold-dark">
              <CheckIcon className="h-3.5 w-3.5" /> {tr.verified}
            </span>
          )}
        </div>
        {product && (
          <p className="mt-1.5 text-xs text-muted">
            {tr.bought}{" "}
            <Link href={href(`/produit/${product.slug}`)} className="link-underline inline-block py-1 text-ink">
              {productName(product, locale)}
              {color ? ` · ${colorLabel(color, locale)}` : ""}
              {r.product?.size ? ` · ${t.common.sizeShort} ${r.product.size}` : ""}
            </Link>
          </p>
        )}
      </footer>
    </article>
  );
}
