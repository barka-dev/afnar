"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { REVIEW_LANG_META, type Review, type ReviewVoice } from "@/lib/reviews";

const BARS = 34;
const RATES = [1, 1.5, 2];
/** Fired when a voice note starts, so the others on the page stop. */
const PLAY_EVENT = "afnar:voice-play";

/** Stable pseudo-waveform for a given id (the real audio isn't downloaded until she presses play). */
function waveform(seed: string): number[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
  const raw = Array.from({ length: BARS }, () => rnd());
  return raw.map((v, i) => {
    const avg = (v + (raw[i - 1] ?? v) + (raw[i + 1] ?? v)) / 3;
    const edge = Math.min(1, (i + 1) / 4, (BARS - i) / 4); // softer at both ends
    return 0.22 + 0.78 * avg * edge;
  });
}

const clock = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

/** WhatsApp-style voice note player: play/pause, seekable waveform, speed, transcript. */
export default function VoiceNote({ voice, id, lang }: { voice: ReviewVoice; id: string; lang: Review["lang"] }) {
  const { t } = useI18n();
  const tr = t.reviews;
  const audio = useRef<HTMLAudioElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const transcriptId = useId();
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(voice.duration);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const bars = useMemo(() => waveform(id), [id]);
  const progress = duration > 0 ? Math.min(1, time / duration) : 0;

  // Smooth progress while playing (timeupdate alone only fires ~4 times a second)
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      if (audio.current) setTime(audio.current.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Only one voice note plays at a time
  useEffect(() => {
    const onOtherPlay = (e: Event) => {
      if ((e as CustomEvent).detail !== audio.current) audio.current?.pause();
    };
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay);
  }, []);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (!a.paused) return a.pause();
    setError(false);
    a.playbackRate = rate;
    if (time > 0 && Math.abs(a.currentTime - time) > 0.25) a.currentTime = time; // seeked before it was loaded
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: a }));
    a.play().catch((err: unknown) => {
      // AbortError = interrupted by a pause, NotAllowedError = browser wants a real tap first.
      // A file that can't be played is reported by the <audio> onError handler.
      if (!(err instanceof DOMException && (err.name === "AbortError" || err.name === "NotAllowedError"))) setError(true);
    });
  };

  const seekTo = (seconds: number) => {
    const a = audio.current;
    if (!a || !duration) return;
    const s = Math.max(0, Math.min(duration, seconds));
    a.currentTime = s;
    setTime(s);
  };

  const seekFromPointer = (clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    seekTo(((clientX - r.left) / r.width) * duration);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
    if (step) seekTo(time + step);
    else if (e.key === "Home") seekTo(0);
    else if (e.key === "End") seekTo(duration);
    else if (e.key === " " || e.key === "Enter") toggle();
    else return;
    e.preventDefault();
  };

  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    if (audio.current) audio.current.playbackRate = next;
  };

  const rateLabel = `${String(rate).replace(".", ",")}×`;

  return (
    <div>
      {/* Media controls are not mirrored in right-to-left languages: time always runs left to right */}
      <div dir="ltr" className="flex items-center gap-3 border border-stone/70 bg-sand/60 py-2.5 pe-3 ps-2.5">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? tr.pause : tr.play}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-ivory transition-colors duration-300 hover:bg-gold-dark"
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ms-0.5 h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            ref={track}
            role="slider"
            tabIndex={0}
            aria-label={tr.seek}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${clock(time)} / ${clock(duration)}`}
            onKeyDown={onKey}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              seekFromPointer(e.clientX);
            }}
            onPointerMove={(e) => e.buttons === 1 && seekFromPointer(e.clientX)}
            className="flex h-10 cursor-pointer touch-none items-center gap-[2px]"
          >
            {bars.map((h, i) => (
              <span
                key={i}
                aria-hidden
                className={`w-full min-w-[2px] rounded-full transition-colors duration-150 ${
                  (i + 0.5) / BARS <= progress ? "bg-gold-dark" : "bg-ink/25"
                }`}
                style={{ height: `${Math.round(h * 100)}%` }}
              />
            ))}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[0.7rem] tabular-nums text-muted">
            <span>{playing || time > 0 ? clock(time) : clock(duration)}</span>
            <MicIcon />
          </div>
        </div>

        <button
          type="button"
          onClick={cycleRate}
          aria-label={tr.speed(rateLabel)}
          className="flex h-10 min-w-11 shrink-0 items-center justify-center rounded-full border border-ink/20 px-2 text-xs tabular-nums transition-colors hover:border-ink"
        >
          {rateLabel}
        </button>

        <audio
          ref={audio}
          src={voice.src}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setTime(0);
          }}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) setDuration(d);
          }}
          onError={() => {
            setPlaying(false);
            setError(true);
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-sold">
          {tr.audioError}
        </p>
      )}

      {voice.transcript && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            aria-expanded={showTranscript}
            aria-controls={transcriptId}
            className="link-underline inline-block py-2 text-xs text-muted hover:text-ink"
          >
            {showTranscript ? tr.hideTranscript : tr.showTranscript}
          </button>
          <p
            id={transcriptId}
            hidden={!showTranscript}
            lang={REVIEW_LANG_META[lang].htmlLang}
            dir={REVIEW_LANG_META[lang].dir}
            className={`mt-1.5 border-s border-gold/60 ps-3 text-sm leading-relaxed text-ink/80 ${lang === "ar" ? "" : "italic"}`}
          >
            « {voice.transcript} »
          </p>
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gold-dark" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  );
}
