"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { STATUS_LABEL, STATUS_STYLE, type OrderStatus } from "@/lib/order-status";
import { audioDuration, uploadFile, type Folder } from "./upload";

export const inputCls =
  "w-full rounded-md border border-stone bg-white px-3 py-2.5 text-[16px] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-ink aria-[invalid=true]:border-sold sm:text-sm";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = "", aside }: { title?: string; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <section className={`rounded-lg border border-stone/70 bg-white p-4 sm:p-6 ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xs font-normal uppercase tracking-[0.18em] text-gold-dark">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, error, hint, children, className = "" }: { label: string; error?: string; hint?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs text-muted">
        {label}
      </label>
      {children(id)}
      {error ? <p className="mt-1 text-xs text-sold">{error}</p> : hint ? <p className="mt-1 text-xs text-muted/80">{hint}</p> : null}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-ink" : "bg-stone"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "start-[1.125rem]" : "start-0.5"}`} />
      </button>
      <span className="text-sm">
        {label}
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" | "danger" }) {
  const v = {
    primary: "bg-ink text-ivory hover:bg-gold-dark",
    outline: "border border-stone bg-white hover:border-ink",
    ghost: "hover:bg-sand",
    danger: "border border-sold/40 bg-white text-sold hover:bg-sold hover:text-white",
  }[variant];
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

/** Two-step delete button: first click asks, second click confirms. */
export function ConfirmButton({ label, confirmLabel = "Confirmer la suppression", onConfirm, className = "" }: { label: string; confirmLabel?: string; onConfirm: () => void | Promise<void>; className?: string }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!asking) return;
    const t = setTimeout(() => setAsking(false), 5000);
    return () => clearTimeout(t);
  }, [asking]);
  return (
    <Btn
      variant="danger"
      disabled={busy}
      className={className}
      onClick={async () => {
        if (!asking) return setAsking(true);
        setBusy(true);
        await onConfirm();
        setBusy(false);
        setAsking(false);
      }}
    >
      {busy ? "…" : asking ? confirmLabel : label}
    </Btn>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function Notice({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const cls = { error: "border-sold/40 bg-sold/5 text-sold", success: "border-emerald-300 bg-emerald-50 text-emerald-800", info: "border-gold/40 bg-gold/5 text-gold-dark" }[tone];
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${cls}`}>
      {children}
    </p>
  );
}

// ——— Media ———

/** Uploads several images; shows thumbnails that can be reordered (first = main photo) and removed. */
export function ImagesInput({ value, onChange, folder, max = 12, label = "Ajouter des photos" }: { value: string[]; onChange: (v: string[]) => void; folder: Folder; max?: number; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");
  const latest = useRef(value);
  latest.current = value;

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const list = [...files].slice(0, max - value.length);
    setBusy(list.length);
    for (const f of list) {
      try {
        const url = await uploadFile(f, folder);
        onChange([...latest.current, url]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi.");
      }
      setBusy((n) => n - 1);
    }
  };
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((src, i) => (
          <div key={src} className="group relative h-24 w-20 overflow-hidden rounded-md border border-stone bg-sand">
            <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            {i === 0 && value.length > 1 && <span className="absolute start-1 top-1 rounded bg-ink/80 px-1.5 text-[0.6rem] text-ivory">Principale</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 text-ivory">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="h-7 w-7 disabled:opacity-30" aria-label="Déplacer avant">
                ‹
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="h-7 w-7" aria-label="Retirer la photo">
                ✕
              </button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="h-7 w-7 disabled:opacity-30" aria-label="Déplacer après">
                ›
              </button>
            </div>
          </div>
        ))}
        {Array.from({ length: busy }, (_, i) => (
          <div key={`b${i}`} className="flex h-24 w-20 items-center justify-center rounded-md border border-dashed border-stone bg-sand/50">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone border-t-ink" />
          </div>
        ))}
        {value.length + busy < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex h-24 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-stone text-xs text-muted transition-colors hover:border-ink hover:text-ink"
          >
            <span className="text-xl leading-none">+</span>
            Photo
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden aria-label={label} onChange={(e) => (add(e.target.files), (e.target.value = ""))} />
      {error && <p className="mt-2 text-xs text-sold">{error}</p>}
    </div>
  );
}

export function SingleImageInput({ value, onChange, folder }: { value: string | null; onChange: (v: string | null) => void; folder: Folder }) {
  return <ImagesInput value={value ? [value] : []} onChange={(v) => onChange(v[0] ?? null)} folder={folder} max={1} />;
}

/** Uploads a voice note and detects its length. */
export function AudioInput({ value, onChange }: { value: { src: string; duration: number } | null; onChange: (v: { src: string; duration: number } | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setError("");
    setBusy(true);
    try {
      const [duration, src] = await Promise.all([audioDuration(f), uploadFile(f, "reviews")]);
      onChange({ src, duration: duration || 1 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.");
    }
    setBusy(false);
  };

  return (
    <div>
      {value ? (
        <div className="flex flex-wrap items-center gap-3">
          <audio controls src={value.src} className="h-10 max-w-full" preload="metadata" />
          <span className="text-xs text-muted">{value.duration}s</span>
          <Btn variant="ghost" onClick={() => onChange(null)} className="text-sold">
            Retirer
          </Btn>
        </div>
      ) : (
        <Btn variant="outline" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone border-t-ink" /> Envoi…
            </>
          ) : (
            "🎙 Ajouter un message vocal"
          )}
        </Btn>
      )}
      <input ref={input} type="file" accept="audio/*,.m4a,.mp3,.ogg,.opus,.wav" hidden onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ""))} />
      {error && <p className="mt-2 text-xs text-sold">{error}</p>}
      <p className="mt-1.5 text-xs text-muted/80">MP3, M4A, OGG/OPUS (vocal WhatsApp)… Pour les vieux iPhone, préférez M4A ou MP3.</p>
    </div>
  );
}

export function useSaved() {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);
  return [saved, () => setSaved(true)] as const;
}
