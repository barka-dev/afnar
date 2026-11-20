"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { SHIPPING } from "@/lib/config";
import { CloseIcon, CashIcon } from "./Icons";
import ProductImage from "./ProductImage";
import QuantityControl from "./QuantityControl";
import { useI18n } from "@/i18n/I18nProvider";
import { colorLabel, productName } from "@/lib/products";
import { useScrollLock } from "@/lib/useScrollLock";

export default function CartDrawer() {
  const { t, locale, price: formatPrice, href } = useI18n();
  const c = t.cart;
  const { items, isOpen, closeCart, subtotal, updateQty, removeItem, count } = useCart();

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  const remaining = SHIPPING.freeThreshold - subtotal;
  const progress = Math.min(100, (subtotal / SHIPPING.freeThreshold) * 100);

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "visible" : "invisible"}`} aria-hidden={!isOpen}>
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label={c.dialog}
        className={`absolute end-0 top-0 flex h-dvh w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-700 ease-[var(--ease-luxe)] ${
          isOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-stone/60 px-5 py-4 sm:px-6 sm:py-6"> 
          <p className="font-serif text-2xl">
            {c.title} <span className="text-base text-muted">({count})</span>
          </p>
          <button onClick={closeCart} className="-me-2.5 flex h-11 w-11 items-center justify-center transition-transform duration-500 hover:rotate-90" aria-label={t.common.close}>
            <CloseIcon />
          </button>
        </div>

        {items.length > 0 && (
          <div className="shrink-0 border-b border-stone/60 px-5 py-3 sm:px-6 sm:py-4">
            <p className="text-xs text-muted">
              {remaining > 0 ? (
                <>
                  {c.remaining(formatPrice(remaining)).before}
                  <span className="text-ink">{formatPrice(remaining)}</span>
                  {c.remaining(formatPrice(remaining)).after}
                </>
              ) : (
                <span className="text-ink">{c.freeReached}</span>
              )}
            </p>
            <div className="mt-2 h-px w-full bg-stone">
              <div className="h-px bg-gold transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-serif text-2xl">{c.empty}</p>
              <p className="mt-2 text-sm text-muted">{c.emptyText}</p>
              <Link href={href("/boutique")} onClick={closeCart} className="btn btn-outline mt-8">
                {t.common.seeShop}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-stone/60">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5 sm:py-6">
                  <Link
                    href={href(`/produit/${item.slug}`)}
                    onClick={closeCart}
                    className="relative block aspect-[3/4] w-24 shrink-0 overflow-hidden bg-sand"
                  >
                    <ProductImage product={item.product} color={item.colorData} sizes="96px" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="font-serif text-lg leading-tight">{productName(item.product, locale)}</p>
                      <p className="whitespace-nowrap text-sm">{formatPrice(item.lineTotal)}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {colorLabel(item.colorData, locale)} · {t.common.size} {item.size}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QuantityControl
                        value={item.qty}
                        max={item.maxQty}
                        onChange={(q) => updateQty(item.key, q)}
                        small
                      />
                      <button
                        onClick={() => removeItem(item.key)}
                        className="-me-2 px-2 py-2.5 text-[0.62rem] uppercase tracking-[0.2em] text-muted underline decoration-stone underline-offset-4 hover:text-ink"
                      >
                        {t.common.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="shrink-0 border-t border-stone/60 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-6 sm:pt-6">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-[0.22em]">{c.subtotal}</span>
              <span className="font-serif text-2xl">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{c.feesNote}</p>
            <Link href={href("/commande")} onClick={closeCart} className="btn btn-primary mt-5 w-full">
              {c.checkout}
            </Link>
            <p className="mt-4 flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted">
              <CashIcon className="h-4 w-4" /> {t.common.cashOnDelivery}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
