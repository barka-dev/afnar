"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useScrollLock } from "@/lib/useScrollLock";
import { CloseIcon } from "@/components/Icons";
import type { ReviewPhoto } from "@/lib/reviews";
import ReviewPhotoView from "./ReviewPhotoView";

/** Full-screen photo viewer: arrows / swipe to browse, Escape or the close button to leave. */
export default function PhotoLightbox({
  photos,
  index,
  name,
  onIndex,
  onClose,
}: {
  photos: ReviewPhoto[];
  index: number;
  name: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const { t, dir } = useI18n();
  const tr = t.reviews;
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const n = photos.length;
  const go = (step: number) => onIndex((index + step + n) % n);

  useScrollLock(true);

  // Focus the dialog, then give focus back to the photo that opened it
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // "next" is to the left in Arabic
      else if (e.key === "ArrowRight" && n > 1) go(dir === "rtl" ? -1 : 1);
      else if (e.key === "ArrowLeft" && n > 1) go(dir === "rtl" ? 1 : -1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr.gallery}
      className="fixed inset-0 z-[60] flex animate-fade-in flex-col bg-ink text-ivory"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null || n < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go((dx < 0 ? 1 : -1) * (dir === "rtl" ? -1 : 1));
      }}
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-4 pt-[env(safe-area-inset-top)] sm:px-6">
        <p dir="ltr" className="text-xs tabular-nums tracking-[0.2em] text-ivory/70">
          {n > 1 ? `${index + 1} / ${n}` : ""}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="-me-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-ivory/10"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Click on the dark area closes */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-20" onClick={onClose}>
        <div className="relative h-full max-h-[min(80dvh,56rem)] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
          <ReviewPhotoView key={index} photo={photos[index]} alt={tr.photoOf(name)} sizes="(min-width: 768px) 48rem, 100vw" fit="contain" />
        </div>

        {n > 1 && (
          <>
            <NavButton side="start" label={tr.prev} onClick={() => go(-1)} />
            <NavButton side="end" label={tr.next} onClick={() => go(1)} />
          </>
        )}
      </div>
    </div>
  );
}

function NavButton({ side, label, onClick }: { side: "start" | "end"; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-ivory backdrop-blur transition-colors hover:bg-ivory hover:text-ink ${
        side === "start" ? "start-2 sm:start-5" : "end-2 sm:end-5"
      }`}
    >
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${side === "start" ? "rtl:rotate-180" : "rotate-180 rtl:rotate-0"}`} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  );
}
