"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import type { Bucket, DeliveryPoint } from "@/lib/server/orders";

/** Validated with the dataviz palette checker on the white card (#fff): both pass contrast, chroma and CVD. */
const COLOR = { orders: "#2a78d6", revenue: "#eb6834" } as const;
const INK = { primary: "#1a1714", secondary: "#52514e", muted: "#898781", grid: "#e1e0d9", axis: "#c3c2b7" };

export const PRESETS = [
  { key: "7j", label: "7 jours" },
  { key: "30j", label: "30 jours" },
  { key: "mois", label: "Ce mois" },
  { key: "90j", label: "90 jours" },
  { key: "12m", label: "12 mois" },
] as const;

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const fmtInt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const dh = (n: number) => `${fmtInt(n)} DH`;
const compact = (n: number) => (n >= 10_000 ? `${fmtInt(n / 1000)} k` : fmtInt(n));

function label(key: string, bucket: Bucket, long = false) {
  const [y, m, d] = key.split("-").map(Number);
  if (bucket === "month") return long ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1];
  if (bucket === "week") return long ? `Semaine du ${d} ${MONTHS[m - 1]}` : `${d} ${MONTHS[m - 1]}`;
  return `${d} ${MONTHS[m - 1]}${long ? ` ${y}` : ""}`;
}

/** Clean axis maximum + ticks (0, step, 2·step, …) */
function niceScale(max: number, integer: boolean, ticks = 4) {
  if (max <= 0) return { top: ticks, step: 1 };
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  let step = (integer ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]).map((f) => f * mag).find((s) => s >= raw)!;
  if (integer) step = Math.max(1, Math.round(step)); // counts: never 0.5 of an order
  return { top: Math.ceil(max / step) * step, step };
}

function Delta({ now, before, money }: { now: number; before: number; money?: boolean }) {
  if (before === 0 && now === 0) return <span className="text-muted">Aucune livraison sur la période précédente</span>;
  if (before === 0) return <span className="text-muted">vs 0 sur la période précédente</span>;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  return (
    <span className={up ? "text-[#006300]" : "text-sold"}>
      {up ? "▲" : "▼"} {up ? "+" : ""}
      {pct}% <span className="text-muted">vs période précédente ({money ? dh(before) : fmtInt(before)})</span>
    </span>
  );
}

export default function DeliveryChart({
  points,
  bucket,
  totals,
  previous,
  preset,
  from,
  to,
}: {
  points: DeliveryPoint[];
  bucket: Bucket;
  totals: { orders: number; revenue: number };
  previous: { orders: number; revenue: number };
  preset: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [custom, setCustom] = useState(preset === "perso");
  const [range, setRange] = useState({ from, to });
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => {
    setRange({ from, to });
    setActive(null); // new period: drop the old highlight
  }, [from, to]);

  const go = (qs: string) => start(() => router.push(`/admin?${qs}`, { scroll: false }));
  const unit = bucket === "day" ? "par jour" : bucket === "week" ? "par semaine" : "par mois";

  return (
    <section className="rounded-lg border border-stone/70 bg-white p-4 sm:p-6" aria-labelledby="delivery-title">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 id="delivery-title" className="text-xs font-normal uppercase tracking-[0.18em] text-gold-dark">
            Livraisons et chiffre d&apos;affaires
          </h2>
          <p className="mt-1 text-xs text-muted">
            Commandes passées au statut « Livrée » du {label(from, "day", true)} au {label(to, "day", true)} · {unit}
          </p>
        </div>

        {/* Period filter — one row above the charts it scopes */}
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Période">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={!custom && preset === p.key}
              onClick={() => {
                setCustom(false);
                go(`periode=${p.key}`);
              }}
              className="flex min-h-9 shrink-0 items-center rounded-full border border-stone px-3.5 text-sm text-muted transition-colors hover:border-ink hover:text-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-ivory"
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={custom}
            onClick={() => setCustom(true)}
            className="flex min-h-9 shrink-0 items-center rounded-full border border-stone px-3.5 text-sm text-muted transition-colors hover:border-ink hover:text-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-ivory"
          >
            Personnalisée
          </button>
        </div>
      </div>

      {custom && (
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (range.from && range.to) go(`periode=perso&du=${range.from}&au=${range.to}`);
          }}
        >
          <label className="text-xs text-muted">
            Du
            <input type="date" value={range.from} max={range.to} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="mt-1 block rounded-md border border-stone bg-white px-3 py-2 text-[16px] text-ink sm:text-sm" />
          </label>
          <label className="text-xs text-muted">
            Au
            <input type="date" value={range.to} min={range.from} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="mt-1 block rounded-md border border-stone bg-white px-3 py-2 text-[16px] text-ink sm:text-sm" />
          </label>
          <button className="min-h-10 rounded-md bg-ink px-4 text-sm text-ivory hover:bg-gold-dark">Afficher</button>
        </form>
      )}

      {/* Refetch keeps the frame: the previous render stays, dimmed, while the new period loads */}
      <div className={`transition-opacity duration-200 ${pending ? "opacity-50" : ""}`} aria-busy={pending}>
        <div className="mt-5 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <Panel
            title="Commandes livrées"
            value={fmtInt(totals.orders)}
            delta={<Delta now={totals.orders} before={previous.orders} />}
            color={COLOR.orders}
            points={points}
            get={(p) => p.orders}
            fmtTick={fmtInt}
            integer
            bucket={bucket}
            active={active}
            setActive={setActive}
          />
          <Panel
            title="Chiffre d'affaires livré"
            value={dh(totals.revenue)}
            delta={<Delta now={totals.revenue} before={previous.revenue} money />}
            color={COLOR.revenue}
            points={points}
            get={(p) => p.revenue}
            fmtTick={compact}
            bucket={bucket}
            active={active}
            setActive={setActive}
          />
        </div>

        <details className="mt-5 text-sm">
          <summary className="cursor-pointer text-xs text-muted hover:text-ink">Voir les chiffres en tableau</summary>
          <div className="mt-3 max-h-72 overflow-auto rounded-md border border-stone/70">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-sand text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 text-start font-normal">Période</th>
                  <th className="px-3 py-2 text-end font-normal">Commandes livrées</th>
                  <th className="px-3 py-2 text-end font-normal">Chiffre d&apos;affaires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/60 tabular-nums">
                {points.map((p) => (
                  <tr key={p.key}>
                    <td className="px-3 py-1.5">{label(p.key, bucket, true)}</td>
                    <td className="px-3 py-1.5 text-end">{fmtInt(p.orders)}</td>
                    <td className="px-3 py-1.5 text-end">{dh(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-stone bg-sand/40">
                <tr>
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-end tabular-nums">{fmtInt(totals.orders)}</td>
                  <td className="px-3 py-2 text-end tabular-nums">{dh(totals.revenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </details>
      </div>
    </section>
  );
}

const H = 190;
const PAD = { top: 10, right: 4, bottom: 26, left: 44 };

function Panel({
  title,
  value,
  delta,
  color,
  points,
  get,
  fmtTick,
  integer = false,
  bucket,
  active,
  setActive,
}: {
  title: string;
  value: string;
  delta: React.ReactNode;
  color: string;
  points: DeliveryPoint[];
  get: (p: DeliveryPoint) => number;
  fmtTick: (n: number) => string;
  integer?: boolean;
  bucket: Bucket;
  active: number | null;
  setActive: (i: number | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(0);
  const descId = useId();
  // The bar is highlighted in both charts, but the tooltip shows only in the one being hovered / focused
  const [here, setHere] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = points.length;
  const max = Math.max(0, ...points.map(get));
  const { top, step } = niceScale(max, integer);
  const plotW = Math.max(0, W - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const slot = n ? plotW / n : 0;
  const GAP = 2; // surface gap between touching bars
  const barW = Math.max(1, Math.min(24, slot * 0.7, slot - GAP));
  const y = (v: number) => PAD.top + plotH - (top ? (v / top) * plotH : 0);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 56)))); // x labels that fit
  const a = active !== null && active < n ? active : null;

  // Bar with a 4px rounded data end, square at the baseline
  const bar = (x: number, v: number) => {
    const h = Math.max(0, y(0) - y(v));
    if (h <= 0) return "";
    const r = Math.min(4, barW / 2, h);
    const yt = y(v);
    return `M${x},${y(0)}V${yt + r}Q${x},${yt} ${x + r},${yt}H${x + barW - r}Q${x + barW},${yt} ${x + barW},${yt + r}V${y(0)}Z`;
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!n) return;
    const cur = a ?? -1;
    const next = { ArrowRight: cur + 1, ArrowLeft: cur - 1, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setActive(Math.max(0, Math.min(n - 1, next)));
  };

  const tip = a !== null && here ? points[a] : null;
  const TIP_HALF = 76; // keeps the tooltip clear of the y-axis numbers and inside the card
  const tipX = a !== null ? PAD.left + slot * a + slot / 2 : 0;

  return (
    <div>
      <p className="text-xs text-muted">{title}</p>
      <p className="mt-1 font-sans text-3xl font-normal leading-none text-ink sm:text-4xl">{value}</p>
      <p className="mt-1.5 text-xs">{delta}</p>

      <div
        ref={box}
        className="relative mt-4 rounded outline-none focus-visible:ring-1 focus-visible:ring-gold"
        style={{ height: H }}
        tabIndex={0}
        role="img"
        aria-label={`${title} ${bucket === "day" ? "par jour" : bucket === "week" ? "par semaine" : "par mois"}. Total ${value}. Flèches gauche/droite pour parcourir.`}
        aria-describedby={descId}
        onKeyDown={onKey}
        onFocus={() => setHere(true)}
        onPointerEnter={() => setHere(true)}
        onBlur={() => {
          setHere(false);
          setActive(null);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "mouse") return;
          setHere(false);
          setActive(null);
        }}
      >
        {W > 0 && (
          <svg width={W} height={H} className="block overflow-visible">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? INK.axis : INK.grid} strokeWidth={1} shapeRendering="crispEdges" />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={INK.muted} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmtTick(t)}
                </text>
              </g>
            ))}
            {points.map((p, i) => {
              const x = PAD.left + slot * i + (slot - barW) / 2;
              const v = get(p);
              return (
                <g key={p.key}>
                  <path d={bar(x, v)} fill={color} opacity={a === null || a === i ? 1 : 0.45} />
                  {/* Hit target: the whole column slot, bigger than the bar */}
                  <rect
                    x={PAD.left + slot * i}
                    y={PAD.top}
                    width={slot}
                    height={plotH}
                    fill="transparent"
                    onPointerEnter={() => setActive(i)}
                    onPointerDown={() => setActive(i)}
                  />
                  {i % every === 0 && (
                    <text x={PAD.left + slot * i + slot / 2} y={H - 8} textAnchor="middle" fontSize={11} fill={INK.muted}>
                      {label(p.key, bucket)}
                    </text>
                  )}
                </g>
              );
            })}
            {max === 0 && (
              <text x={PAD.left + plotW / 2} y={PAD.top + plotH / 2} textAnchor="middle" fontSize={12} fill={INK.muted}>
                Aucune livraison sur cette période
              </text>
            )}
          </svg>
        )}

        {tip && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 w-max max-w-[14rem] -translate-x-1/2 rounded-md border border-stone/70 bg-white px-3 py-2 text-xs shadow-md"
            style={{ left: Math.min(Math.max(tipX, PAD.left + TIP_HALF), W - TIP_HALF) }}
          >
            <p className="text-muted">{label(tip.key, bucket, true)}</p>
            <p className="mt-1 flex items-center gap-2">
              <span className="h-0.5 w-3 rounded" style={{ background: COLOR.orders }} />
              <strong className="font-normal text-ink">{fmtInt(tip.orders)}</strong>
              <span className="text-muted">livrée{tip.orders > 1 ? "s" : ""}</span>
            </p>
            <p className="mt-0.5 flex items-center gap-2">
              <span className="h-0.5 w-3 rounded" style={{ background: COLOR.revenue }} />
              <strong className="font-normal text-ink">{dh(tip.revenue)}</strong>
            </p>
          </div>
        )}
      </div>
      <p id={descId} className="sr-only">
        Le détail par période est disponible dans le tableau sous les graphiques.
      </p>
    </div>
  );
}
