"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import QuantityControl from "@/components/QuantityControl";
import SizeGuide from "@/components/SizeGuide";
import { CashIcon, CheckIcon, ExchangeIcon, TruckIcon, WhatsAppIcon } from "@/components/Icons";
import { useCart } from "@/context/CartContext";
import { STORE } from "@/lib/config";
import { useI18n } from "@/i18n/I18nProvider";
import { shippingText } from "@/i18n";
import { useBottomBarFlag, useOutOfView } from "@/lib/useScrollLock";
import { useCatalog } from "@/context/CatalogContext";
import {
  categoryName,
  colorLabel,
  isColorAvailable,
  isOneSize,
  isProductAvailable,
  localizeProduct,
  ONE_SIZE,
  sizeLabel,
  stockFor,
  type Product,
  type Size,
} from "@/lib/products";

/** Magnifier zoom level on the product photo (mouse hover). */
const ZOOM = 2.5;

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { t, locale, dir, price: formatPrice, href } = useI18n();
  const tp = t.product;
  const lp = localizeProduct(product, locale);
  const category = useCatalog().getCategory(product.category);
  const ship = shippingText(locale);
  const { addItem, openCart } = useCart();

  const available = isProductAvailable(product);
  const firstAvailable = product.colors.find((c) => isColorAvailable(product, c)) ?? product.colors[0];

  // One-size products (khimars) have no size to choose: it is selected from the start
  const oneSize = isOneSize(product);
  const [colorName, setColorName] = useState(firstAvailable.name);
  const [size, setSize] = useState<Size | null>(oneSize ? ONE_SIZE : null);
  const sizeText = (s: string) => sizeLabel(s, t.common.oneSize);
  const setSaving = product.bundleParts ? product.bundleParts.reduce((n, p) => n + p.price, 0) - product.price : 0;
  const [qty, setQty] = useState(1);
  const [slide, setSlide] = useState(0);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("description");
  const actionsRef = useRef<HTMLDivElement>(null);
  const sizesRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  // Mobile/tablet: show a sticky "add to cart" bar once the main buttons have scrolled out of view (above).
  const showBar = useOutOfView(actionsRef, "above");
  useBottomBarFlag(showBar && available);

  const color = product.colors.find((c) => c.name === colorName)!;
  const stock = size ? stockFor(color, size) : 0;

  // Gallery: every photo of the selected colour, or the two illustration views (front / detail) when it has none.
  const photoCount = color.images?.length ?? 0;
  const slides = Array.from({ length: photoCount || 2 }, (_, i) => i);
  const current = Math.min(slide, slides.length - 1);
  const viewOf = (i: number) => (i === 0 ? "front" : "detail");
  const slideLabel = (i: number) => (photoCount ? tp.photoN(i + 1) : i === 0 ? tp.frontView : tp.detailView);
  // Magnifier: zoom level toggles with state; the zoom point is written straight to the DOM (no re-render per mouse move).
  const [zoomed, setZoomed] = useState(false);
  const zoomRef = useRef<HTMLDivElement>(null);
  const moveZoom = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    if (zoomRef.current) zoomRef.current.style.transformOrigin = `${x}% ${y}%`;
  };
  const step = (delta: number) => setSlide((s) => (Math.min(s, slides.length - 1) + delta + slides.length) % slides.length);

  const lowStock = useMemo(() => (size && stock > 0 && stock <= 2 ? stock : null), [size, stock]);

  const chooseColor = (name: string) => {
    const c = product.colors.find((x) => x.name === name)!;
    setColorName(name);
    setSlide(0);
    setError("");
    if (size && stockFor(c, size) <= 0) setSize(null);
    setQty(1);
  };

  const chooseSize = (s: Size) => {
    setSize(s);
    setError("");
    setQty((q) => Math.min(q, stockFor(color, s)) || 1);
  };

  const add = (goToCheckout: boolean) => {
    if (!size) {
      setError(tp.chooseSize);
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addItem({ slug: product.slug, color: color.name, size, qty });
    if (goToCheckout) {
      router.push(href("/commande"));
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    openCart();
  };

  const askText = encodeURIComponent(t.whatsapp.product(STORE.name, lp.name, colorLabel(color, locale), size ?? undefined));

  const sections = [
    { id: "description", title: tp.description, body: <p>{lp.description}</p> },
    {
      id: "details",
      title: tp.fabricCare,
      body: (
        <ul className="space-y-2">
          <li>{tp.fabric(lp.fabric)}</li>
          {lp.details.map((d) => (
            <li key={d}>— {d}</li>
          ))}
        </ul>
      ),
    },
    {
      id: "livraison",
      title: tp.deliveryPayment,
      body: (
        <ul className="space-y-2">
          {tp.deliveryLines(ship).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-0 pt-4 sm:px-5 sm:pt-8 md:grid-cols-2 md:gap-10 md:px-10 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
      {/* ——— Gallery ——— */}
      <div className="md:sticky md:top-24 md:self-start">
        <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
          <div className="flex justify-center gap-3 overflow-x-auto px-4 py-1 sm:justify-start sm:px-1 lg:max-h-[78svh] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:py-1">
            {slides.map((i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-sand transition-all duration-500 sm:w-20 ${
                  current === i ? "ring-1 ring-ink ring-offset-2 ring-offset-ivory" : "opacity-60 hover:opacity-100"
                }`}
                aria-label={slideLabel(i)}
                aria-current={current === i}
              >
                <div className={`absolute inset-0 ${available ? "" : "grayscale"}`}>
                  <ProductImage product={product} color={color} view={viewOf(i)} index={i} sizes="80px" />
                </div>
              </button>
            ))}
          </div>
          <div
            className="group relative aspect-[3/4] max-h-[78svh] flex-1 cursor-zoom-in touch-pan-y overflow-hidden bg-sand md:max-h-none"
            // Magnifier (mouse only), on photos and on the illustration alike: the image zooms in around the
            // cursor and follows it.
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              moveZoom(e);
              setZoomed(true);
            }}
            onPointerMove={(e) => e.pointerType === "mouse" && moveZoom(e)}
            onPointerLeave={() => setZoomed(false)}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              // swipe left = next photo (mirrored in Arabic, where the gallery reads right to left)
              if (Math.abs(dx) > 40) step((dx < 0 ? 1 : -1) * (dir === "rtl" ? -1 : 1));
            }}
          >
            <div key={`${color.name}-${current}`} className={`absolute inset-0 animate-fade-in ${available ? "" : "grayscale opacity-50"}`}>
              <div
                ref={zoomRef}
                className="absolute inset-0 transition-transform duration-300 ease-[var(--ease-luxe)]"
                style={zoomed ? { transform: `scale(${ZOOM})` } : undefined}
              >
                <ProductImage product={product} color={color} view={viewOf(current)} index={current} priority sizes="(min-width: 1024px) 50vw, 100vw" />
                {/* sharper copy of a photo while zooming (photos are stored up to 2000px); the illustration is vector, already sharp */}
                {zoomed && photoCount > 0 && <ProductImage product={product} color={color} index={current} sizes="2000px" />}
              </div>
            </div>
            {!available && <div className="crossed absolute inset-0 [--cross-width:1.25px]" aria-hidden />}
            {/* swipe indicator (touch screens) */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 lg:hidden" aria-hidden>
              {slides.map((i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${current === i ? "w-6 bg-ink/70" : "w-1.5 bg-ink/25"}`} />
              ))}
            </div>
            {!available && (
              <span className="absolute start-5 top-5 bg-ivory/90 px-4 py-1.5 text-[0.62rem] uppercase tracking-[0.25em] text-sold">
                {t.common.soldOut}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ——— Info ——— */}
      <div className="px-4 sm:px-0 lg:pt-6">
        {category && <p className="eyebrow">{categoryName(category, locale)}</p>}
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className={`font-serif text-[2.1rem] font-light leading-tight sm:text-4xl lg:text-5xl ${available ? "" : "text-muted line-through decoration-sold decoration-1"}`}>
            {lp.name}
          </h1>
        </div>
        <div className="mt-4 flex items-baseline gap-3">
          <p className="text-2xl">{formatPrice(product.price)}</p>
          {product.compareAtPrice && <p className="text-muted line-through">{formatPrice(product.compareAtPrice)}</p>}
        </div>
        <p className="mt-6 leading-relaxed text-muted">{lp.shortDescription}</p>

        {/* Set: its two pieces, each linking to its own page, and the saving versus buying them separately */}
        {product.bundleParts && (
          <div className="mt-6 border border-stone/70 bg-sand/40 p-4 sm:p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.22em]">{tp.setIncludes}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {product.bundleParts.map((part) => (
                <li key={part.role} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <Link href={href(`/produit/${part.slug}`)} className="link-underline">
                    {part.nameAr || part.name}
                  </Link>
                  <span className="text-muted">
                    {part.colorAr || part.color} · {formatPrice(part.price)}
                  </span>
                </li>
              ))}
            </ul>
            {setSaving > 0 && <p className="mt-3 text-xs text-gold-dark">{tp.setSaving(formatPrice(setSaving))}</p>}
          </div>
        )}

        <div className="my-6 h-px bg-stone/70 sm:my-8" />

        {/* Colours */}
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.22em]">
            {t.common.color} : <span className="text-muted">{colorLabel(color, locale)}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            {product.colors.map((c) => {
              const ok = isColorAvailable(product, c);
              const selected = c.name === colorName;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => ok && chooseColor(c.name)}
                  disabled={!ok}
                  title={ok ? colorLabel(c, locale) : `${colorLabel(c, locale)} — ${t.common.unavailable}`}
                  aria-label={ok ? colorLabel(c, locale) : `${colorLabel(c, locale)}, ${t.common.unavailable}`}
                  aria-pressed={selected}
                  className={`relative h-11 w-11 rounded-full p-[3px] transition-all duration-300 ${
                    ok ? "hover:scale-110" : "crossed cursor-not-allowed [--cross-width:1px]"
                  } ${selected ? "ring-1 ring-ink" : "ring-1 ring-stone"}`}
                >
                  <span
                    className={`block h-full w-full rounded-full ${ok ? "" : "opacity-35 grayscale"}`}
                    style={{ background: c.hex }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Sizes (one-size products: just the label, no buttons, no size guide) */}
        <div className="mt-8 scroll-mt-28" ref={sizesRef}>
          <div className="flex items-center justify-between">
            <p className="text-[0.68rem] uppercase tracking-[0.22em]">
              {t.common.size} : <span className="text-muted">{size ? sizeText(size) : "—"}</span>
            </p>
            {!oneSize && (
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="-my-2 py-2 text-[0.62rem] uppercase tracking-[0.22em] text-muted underline decoration-stone underline-offset-4 hover:text-ink"
              >
                {tp.sizeGuide}
              </button>
            )}
          </div>
          {product.bundle && <p className="mt-2 text-xs text-muted">{tp.setSizeNote}</p>}
          <div className={`mt-4 grid grid-cols-5 gap-2 ${oneSize ? "hidden" : ""}`}>
            {product.sizes.map((s) => {
              const ok = stockFor(color, s) > 0;
              const selected = s === size;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!ok}
                  onClick={() => chooseSize(s)}
                  aria-pressed={selected}
                  aria-label={ok ? `${t.common.size} ${s}` : `${t.common.size} ${s}, ${t.common.unavailable}`}
                  title={ok ? undefined : tp.sizeUnavailableInColor}
                  className={`h-12 border text-sm transition-all duration-300 ${
                    !ok
                      ? "crossed cursor-not-allowed border-stone/60 bg-sand/60 text-muted/50"
                      : selected
                        ? "border-ink bg-ink text-ivory"
                        : "border-stone hover:border-ink"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <p className={`mt-3 min-h-5 text-xs ${error ? "text-sold" : "text-gold-dark"}`} role="status">
            {error || (lowStock ? tp.lowStock(lowStock) : "")}
          </p>
        </div>

        {/* Actions */}
        {available ? (
          <div className="mt-4 space-y-3" ref={actionsRef}>
            <div className="flex gap-3">
              <QuantityControl value={qty} min={1} max={size ? stock : 1} onChange={setQty} />
              <button type="button" onClick={() => add(false)} className="btn btn-outline flex-1 !px-4">
                {added ? (
                  <>
                    <CheckIcon /> {tp.added}
                  </>
                ) : (
                  tp.addToCart
                )}
              </button>
            </div>
            <button type="button" onClick={() => add(true)} className="btn btn-primary w-full">
              {tp.orderNow}
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <button type="button" disabled className="btn btn-primary w-full">
              {t.common.soldOut}
            </button>
          </div>
        )}

        <a
          href={`https://wa.me/${STORE.whatsappNumber}?text=${askText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-[0.22em] text-muted transition-colors hover:text-[#1f8f4e]"
        >
          <WhatsAppIcon className="h-4 w-4" />
          {available ? tp.askQuestion : tp.notifyBack}
        </a>

        <ul className="mt-10 grid grid-cols-3 gap-3 border-y border-stone/70 py-6 text-center text-[0.62rem] uppercase tracking-[0.16em] text-muted">
          <li className="flex flex-col items-center gap-2">
            <CashIcon className="h-5 w-5 text-gold-dark" /> {t.common.cashOnDelivery}
          </li>
          <li className="flex flex-col items-center gap-2">
            <TruckIcon className="h-5 w-5 text-gold-dark" /> {tp.delivery(ship.national)}
          </li>
          <li>
            <Link href={href("/echange")} className="flex flex-col items-center gap-2 underline-offset-4 hover:text-ink hover:underline">
              <ExchangeIcon className="h-5 w-5 text-gold-dark" /> {tp.exchange}
            </Link>
          </li>
        </ul>

        <div className="mt-2">
          {sections.map((s) => {
            const open = openSection === s.id;
            return (
              <div key={s.id} className="border-b border-stone/70">
                <button
                  type="button"
                  onClick={() => setOpenSection(open ? null : s.id)}
                  className="flex w-full items-center justify-between py-5 text-start text-[0.68rem] uppercase tracking-[0.22em]"
                  aria-expanded={open}
                >
                  {s.title}
                  <span className={`text-lg transition-transform duration-500 ${open ? "rotate-45" : ""}`}>+</span>
                </button>
                <div
                  className={`grid text-sm leading-relaxed text-muted transition-all duration-500 ease-[var(--ease-luxe)] ${
                    open ? "grid-rows-[1fr] pb-6 opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">{s.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SizeGuide open={guideOpen} onClose={() => setGuideOpen(false)} />

      {/* ——— Sticky add-to-cart bar (phones & tablets) ——— */}
      {available && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-t border-stone/70 bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-500 ease-[var(--ease-luxe)] sm:px-5 lg:hidden ${
            showBar ? "translate-y-0" : "pointer-events-none translate-y-full"
          }`}
          aria-hidden={!showBar}
        >
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-lg leading-tight">{lp.name}</p>
              <p className="truncate text-xs text-muted">
                {formatPrice(product.price)} · {colorLabel(color, locale)}
                {size ? ` · ${t.common.size} ${sizeText(size)}` : ""}
              </p>
            </div>
            <button
              type="button"
              tabIndex={showBar ? 0 : -1}
              onClick={() => add(false)}
              className="btn btn-primary shrink-0 !px-5 !py-3.5"
            >
              {added ? (
                <>
                  <CheckIcon /> {tp.added}
                </>
              ) : size ? (
                tp.addToCart
              ) : (
                tp.selectSize
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
