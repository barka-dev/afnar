"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StarMotif } from "@/components/Icons";
import { deliveryDelay } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";
import { cityLabel } from "@/lib/cities";
import { colorLabel, productName, sizeLabel } from "@/lib/products";
import { useCatalog } from "@/context/CatalogContext";
import { LAST_ORDER_KEY, type OrderPayload } from "@/lib/order";

type StoredOrder = OrderPayload;

export default function ThankYou({ refParam }: { refParam: string }) {
  const { t, locale, price: formatPrice, href } = useI18n();
  const ty = t.thanks;
  const [order, setOrder] = useState<StoredOrder | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      if (raw) {
        const o = JSON.parse(raw) as StoredOrder;
        if (!refParam || o.ref === refParam) setOrder(o);
      }
    } catch {
      /* ignore */
    }
  }, [refParam]);

  const { getProduct } = useCatalog();
  // Show product/colour names in the current language (the stored order keeps the French ones for WhatsApp)
  const lineName = (slug: string | undefined, fallback: string) => {
    const p = slug ? getProduct(slug) : undefined;
    return p ? productName(p, locale) : fallback;
  };
  const lineColor = (slug: string | undefined, color: string) => {
    const c = slug ? getProduct(slug)?.colors.find((x) => x.name === color) : undefined;
    return c ? colorLabel(c, locale) : color;
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center">
      <StarMotif className="h-10 w-10 animate-fade-in text-gold" />
      <p className="eyebrow mt-8 animate-fade-in">{ty.order(order?.ref ?? refParam)}</p>
      <h1 className="mt-4 animate-fade-in font-serif text-5xl font-light md:text-6xl" style={{ animationDelay: "100ms" }}>
        {ty.title(order ? order.customer.fullName.split(" ")[0] : undefined)}
      </h1>
      <p className="mt-6 max-w-md animate-fade-in leading-relaxed text-muted" style={{ animationDelay: "200ms" }}>
        {ty.text1}
        <strong className="font-normal text-ink">{ty.textStrong}</strong>
        {ty.text2}
        {order && (
          <>
            {" "}
            <span dir="ltr" className="whitespace-nowrap text-ink">
              {order.customer.phone.replace(/(\d{2})(?=\d)/g, "$1 ")}
            </span>
            .
          </>
        )}
      </p>

      {order && (
        <div className="mt-12 w-full animate-fade-in border-y border-stone/70 py-8 text-start text-sm" style={{ animationDelay: "300ms" }}>
          <ul className="space-y-2">
            {order.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span>
                  {lineName(l.slug, l.name)}{" "}
                  <span className="text-muted">
                    · {lineColor(l.slug, l.color)} · {t.common.sizeShort} {sizeLabel(l.size, t.common.oneSize)} × {l.qty}
                  </span>
                </span>
                <span className="whitespace-nowrap">{formatPrice(l.qty * l.unitPrice)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-stone/70 pt-5">
            <span className="text-[0.68rem] uppercase tracking-[0.22em]">{ty.toPay}</span>
            <span className="font-serif text-2xl">{formatPrice(order.total)}</span>
          </div>
          <p className="mt-3 text-xs text-muted">
            {ty.deliveryTo(cityLabel(order.customer.city, locale), deliveryDelay(order.customer.city, locale))}
          </p>
        </div>
      )}

      <div className="mt-12 flex animate-fade-in flex-wrap justify-center gap-4" style={{ animationDelay: "400ms" }}>
        <Link href={href("/boutique")} className="btn btn-primary">
          {ty.continue}
        </Link>
      </div>
    </div>
  );
}
