"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ProductImage from "@/components/ProductImage";
import QuantityControl from "@/components/QuantityControl";
import { CashIcon, CheckIcon } from "@/components/Icons";
import { useCart } from "@/context/CartContext";
import { MOROCCAN_CITIES, cityLabel } from "@/lib/cities";
import { SHIPPING, shippingFee } from "@/lib/config";
import { deliveryDelay } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";
import { colorLabel, productName } from "@/lib/products";
import { useBottomBarFlag, useOutOfView, useScrollLock } from "@/lib/useScrollLock";
import { normalizeMoroccanPhone } from "@/lib/format";
import { LAST_ORDER_KEY, type OrderRequest, type OrderResponse } from "@/lib/order";

type Errors = Partial<Record<"fullName" | "phone" | "city" | "address", string>>;
type Form = { fullName: string; phone: string; city: string; address: string; note: string };

/** What the customer typed is kept here until the order is sent, so a failed send or a page reload loses nothing. */
const DRAFT_KEY = "afnar-checkout-draft";
const EMPTY: Form = { fullName: "", phone: "", city: "", address: "", note: "" };
/** Give up waiting after this long and let the customer retry */
const SEND_TIMEOUT_MS = 40_000;
/** Keep the "sending" screen at least this long so it doesn't just flash */
const MIN_SENDING_MS = 700;

export default function CheckoutForm() {
  const router = useRouter();
  const { t, locale, price: formatPrice, href } = useI18n();
  const tc = t.checkout;
  const { items, subtotal, hydrated, updateQty, removeItem, clear } = useCart();

  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  // idle → sending → done (thank-you page) | failed (form kept, customer can send again)
  const [phase, setPhase] = useState<"idle" | "sending" | "failed" | "done">("idle");
  const [sendError, setSendError] = useState("");
  const honeypot = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const draftLoaded = useRef(false);
  const submitting = phase === "sending" || phase === "done";

  // Restore the draft (e.g. after a failed send and a page reload), then keep it saved as the customer types.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) setForm({ ...EMPTY, ...JSON.parse(saved) });
    } catch {
      /* ignore */
    }
    draftLoaded.current = true;
  }, []);
  useEffect(() => {
    if (!draftLoaded.current || phase === "done") return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form, phase]);

  // Lock the page only while sending; once sent, nothing is left behind to scroll and the thank-you page starts at the top.
  useScrollLock(phase === "sending");

  // After a failed send, bring the error and the "send again" button into view.
  useEffect(() => {
    if (phase !== "failed") return;
    alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    alertRef.current?.focus({ preventScroll: true });
  }, [phase]);

  // Phones/tablets: keep the total and the confirm button reachable until the real one scrolls into view.
  const showBar = useOutOfView(submitRef, "below", [hydrated, items.length]);
  useBottomBarFlag(showBar);

  const shipping = shippingFee(form.city, subtotal);
  const total = subtotal + shipping;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k as keyof Errors]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (form.fullName.trim().length < 3) e.fullName = tc.errors.fullName;
    if (!normalizeMoroccanPhone(form.phone)) e.phone = tc.errors.phone;
    if (!form.city) e.city = tc.errors.city;
    if (form.address.trim().length < 8) e.address = tc.errors.address;
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    setSendError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`f-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setPhase("sending");
    const started = Date.now();

    // The order is sent to the store by the server (Telegram): the customer stays on the site.
    const body: OrderRequest = {
      locale,
      items: items.map((i) => ({ slug: i.slug, color: i.color, size: i.size, qty: i.qty })),
      customer: {
        fullName: form.fullName.trim(),
        phone: form.phone,
        city: form.city,
        address: form.address.trim(),
        note: form.note.trim() || undefined,
      },
      website: honeypot.current?.value ?? "",
    };

    let res: OrderResponse;
    try {
      const r = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });
      res = await r.json();
    } catch {
      // network error, timeout, or a non-JSON error page
      res = { ok: false, error: "send_failed" };
    }

    const wait = MIN_SENDING_MS - (Date.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));

    if (!res.ok) {
      if (res.error === "invalid" && res.fields?.length) {
        setPhase("idle");
        const fe: Errors = {};
        for (const f of res.fields) if (f in tc.errors) fe[f as keyof Errors] = tc.errors[f as keyof Errors];
        setErrors(fe);
        document.getElementById(`f-${res.fields[0]}`)?.focus();
        return;
      }
      setSendError(res.error === "stock" ? tc.errors.stock : res.error === "rate_limit" ? tc.errors.rateLimit : tc.errors.send);
      setPhase("failed");
      return;
    }

    // Sent: show the thank-you page. (The "sending" screen stays up until it appears.)
    setPhase("done");
    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(res.order));
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    router.push(href(`/merci?ref=${res.order.ref}`));
    clear();
  };

  const confirmLabel = phase === "failed" ? tc.retry : tc.confirm;

  if (!hydrated) return <div className="min-h-[60vh]" />;

  if (phase === "done") return <SendingOverlay title={tc.sendingTitle} text={tc.sendingText} />;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <p className="eyebrow">{tc.emptyEyebrow}</p>
        <h1 className="mt-4 font-serif text-5xl font-light">{t.cart.empty}</h1>
        <p className="mt-4 text-muted">{tc.emptyText}</p>
        <Link href={href("/boutique")} className="btn btn-primary mt-10">
          {t.common.seeShop}
        </Link>
      </div>
    );
  }

  const fieldLabel = "text-[0.62rem] uppercase tracking-[0.22em] text-muted";
  const errorText = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`e-${k}`} className="mt-2 text-xs text-sold">
        {errors[k]}
      </p>
    ) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-5 md:px-10 md:py-16 lg:pb-16">
      <div className="text-center">
        <p className="eyebrow animate-fade-in">{tc.eyebrow}</p>
        <h1 className="mt-3 animate-fade-in font-serif text-4xl font-light sm:mt-4 sm:text-5xl">{tc.title}</h1>
      </div>

      <form
        id="checkout-form"
        onSubmit={submit}
        noValidate
        aria-busy={submitting}
        className="mt-10 grid gap-12 sm:mt-16 lg:grid-cols-[1.2fr_1fr] lg:gap-16"
      >
        {/* Anti-spam trap: hidden from people, filled in by bots.
            Visually hidden in place (no off-screen offset: a -9999px offset widens right-to-left pages). */}
        <div aria-hidden="true" className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0 [clip-path:inset(50%)]">
          <label>
            Website
            <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>
        {/* ——— Customer ——— */}
        <div className="animate-fade-in" style={{ animationDelay: "120ms" }}>
          <h2 className="font-serif text-2xl">{tc.yourDetails}</h2>
          <div className="mt-6 grid gap-7 sm:mt-8 sm:grid-cols-2 sm:gap-8">
            <div className="sm:col-span-2">
              <label htmlFor="f-fullName" className={fieldLabel}>{tc.fullName}</label>
              <input
                id="f-fullName"
                className="field"
                autoComplete="name"
                autoCapitalize="words"
                enterKeyHint="next"
                value={form.fullName}
                onChange={set("fullName")}
                aria-invalid={!!errors.fullName}
                aria-describedby="e-fullName"
                placeholder={tc.fullNamePh}
              />
              {errorText("fullName")}
            </div>
            <div>
              <label htmlFor="f-phone" className={fieldLabel}>{tc.phone}</label>
              <input
                id="f-phone"
                className="field"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="next"
                value={form.phone}
                onChange={set("phone")}
                aria-invalid={!!errors.phone}
                aria-describedby="e-phone"
                placeholder="06 12 34 56 78"
                dir="ltr"
              />
              {errorText("phone")}
            </div>
            <div>
              <label htmlFor="f-city" className={fieldLabel}>{tc.city}</label>
              <select
                id="f-city"
                className="field cursor-pointer"
                value={form.city}
                onChange={set("city")}
                aria-invalid={!!errors.city}
                aria-describedby="e-city"
              >
                <option value="">{tc.choose}</option>
                {MOROCCAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {cityLabel(c, locale)}
                  </option>
                ))}
              </select>
              {errorText("city")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-address" className={fieldLabel}>{tc.address}</label>
              <input
                id="f-address"
                className="field"
                autoComplete="street-address"
                enterKeyHint="next"
                value={form.address}
                onChange={set("address")}
                aria-invalid={!!errors.address}
                aria-describedby="e-address"
                placeholder={tc.addressPh}
              />
              {errorText("address")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-note" className={fieldLabel}>{tc.note}</label>
              <textarea
                id="f-note"
                className="field resize-none"
                rows={2}
                value={form.note}
                onChange={set("note")}
                placeholder={tc.notePh}
              />
            </div>
          </div>

          <h2 className="mt-12 font-serif text-2xl sm:mt-16">{tc.payment}</h2>
          <div className="mt-6 flex items-start gap-4 border border-ink p-4 sm:p-5">
            <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink">
              <span className="h-2 w-2 rounded-full bg-ink" />
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm">
                <CashIcon className="h-5 w-5 text-gold-dark" /> {tc.cod}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {tc.codText}
              </p>
            </div>
          </div>
        </div>

        {/* ——— Summary ——— */}
        <aside className="animate-fade-in lg:sticky lg:top-24 lg:self-start" style={{ animationDelay: "240ms" }}>
          <div className="-mx-4 bg-sand/60 px-4 py-6 sm:mx-0 sm:p-6 md:p-8">
            <h2 className="font-serif text-2xl">{tc.summary}</h2>
            <ul className="mt-6 divide-y divide-stone/70">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4 py-4">
                  <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-sand">
                    <ProductImage product={i.product} color={i.colorData} sizes="64px" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="font-serif text-lg leading-tight">{productName(i.product, locale)}</p>
                      <p className="whitespace-nowrap text-sm">{formatPrice(i.lineTotal)}</p>
                    </div>
                    <p className="text-xs text-muted">
                      {colorLabel(i.colorData, locale)} · {t.common.size} {i.size}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityControl small value={i.qty} max={i.maxQty} onChange={(q) => updateQty(i.key, q)} />
                      <button
                        type="button"
                        onClick={() => removeItem(i.key)}
                        className="-me-2 px-2 py-2.5 text-[0.6rem] uppercase tracking-[0.2em] text-muted underline decoration-stone underline-offset-4"
                      >
                        {t.common.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-3 border-t border-stone/70 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{tc.subtotal}</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">
                  {tc.delivery}
                  {form.city ? ` · ${cityLabel(form.city, locale)}` : ""}
                </dt>
                <dd>{!form.city ? tc.byCity : shipping === 0 ? t.shipping.free : formatPrice(shipping)}</dd>
              </div>
              {form.city && <p className="text-xs text-muted">{tc.estimated(deliveryDelay(form.city, locale))}</p>}
              {subtotal < SHIPPING.freeThreshold && (
                <p className="text-xs text-gold-dark">{tc.freeFrom(formatPrice(SHIPPING.freeThreshold))}</p>
              )}
              <div className="flex items-baseline justify-between border-t border-stone/70 pt-4">
                <dt className="text-[0.68rem] uppercase tracking-[0.22em]">{tc.toPay}</dt>
                <dd className="font-serif text-3xl">{formatPrice(total)}</dd>
              </div>
            </dl>

            {phase === "failed" && (
              <div
                ref={alertRef}
                role="alert"
                tabIndex={-1}
                className="mt-6 scroll-mt-28 border border-sold/40 bg-sold/5 px-4 py-4 text-sm leading-relaxed text-sold outline-none"
              >
                <p className="font-normal">{tc.failedTitle}</p>
                <p className="mt-1">{sendError}</p>
              </div>
            )}
            <button ref={submitRef} type="submit" disabled={submitting} className="btn btn-primary mt-8 w-full">
              {submitting ? (
                <>
                  <Spinner /> {tc.sending}
                </>
              ) : phase === "failed" ? (
                <>
                  <RetryIcon /> {confirmLabel}
                </>
              ) : (
                <>
                  <CheckIcon /> {confirmLabel}
                </>
              )}
            </button>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              {tc.confirmNote}
            </p>
          </div>
        </aside>
      </form>

      {/* ——— Sticky total + confirm (phones & tablets) ——— */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-stone/70 bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-500 ease-[var(--ease-luxe)] sm:px-5 lg:hidden ${
          showBar ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!showBar}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="shrink-0">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted">{tc.total}</p>
            <p className="whitespace-nowrap font-serif text-2xl leading-tight">{formatPrice(total)}</p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            tabIndex={showBar ? 0 : -1}
            disabled={submitting}
            className="btn btn-primary min-w-0 flex-1 !px-3 !py-3.5 !tracking-[0.14em]"
          >
            {submitting ? (
              <>
                <Spinner /> {tc.sending}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>

      {phase === "sending" && <SendingOverlay title={tc.sendingTitle} text={tc.sendingText} />}
    </div>
  );
}

/** Full-screen "your order is being sent" screen; also blocks edits while sending. */
function SendingOverlay({ title, text }: { title: string; text: string }) {
  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed inset-0 z-[70] flex animate-fade-in items-center justify-center bg-ivory/95 px-6 backdrop-blur-sm"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <span aria-hidden className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border border-stone border-t-gold-dark [animation-duration:1.1s]" />
          <span className="h-2 w-2 rounded-full bg-gold-dark" />
        </span>
        <p className="mt-8 font-serif text-3xl">{title}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">{text}</p>
      </div>
    </div>
  );
}

function RetryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

function Spinner() {
  return <span aria-hidden className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />;
}
