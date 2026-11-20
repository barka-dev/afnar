"use client";

import Link from "next/link";
import ProductImage from "./ProductImage";
import { useI18n } from "@/i18n/I18nProvider";
import { useCatalog } from "@/context/CatalogContext";
import { categoryName, colorLabel, isColorAvailable, isProductAvailable, productName, type Product } from "@/lib/products";

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { t, locale, price, href } = useI18n();
  const category = useCatalog().getCategory(product.category);
  const available = isProductAvailable(product);
  const firstColor = product.colors.find((c) => isColorAvailable(product, c)) ?? product.colors[0];
  const name = productName(product, locale);

  return (
    <Link
      href={href(`/produit/${product.slug}`)}
      className="group block"
      aria-label={`${name}${available ? "" : ` — ${t.product.soldOutAria}`}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        <div className={`absolute inset-0 ${available ? "" : "grayscale opacity-50"}`}>
          {/* main view */}
          <div className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-[1.06]">
            <ProductImage product={product} color={firstColor} priority={priority} />
          </div>
          {/* detail view revealed on hover */}
          <div className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-[var(--ease-luxe)] group-hover:opacity-100">
            <ProductImage product={product} color={firstColor} view="detail" />
          </div>
        </div>

        {/* red strike when sold out (kept outside the grayscale layer so it stays red) */}
        {!available && <div className="crossed absolute inset-0 [--cross-width:1px]" aria-hidden />}

        <div className="absolute start-2.5 top-2.5 flex flex-col items-start gap-1.5 sm:start-4 sm:top-4 sm:gap-2">
          {!available && (
            <span className="bg-ivory/90 px-2 py-1 text-[0.58rem] uppercase tracking-[0.2em] text-sold sm:px-3 sm:text-[0.6rem] sm:tracking-[0.25em]">{t.common.soldOut}</span>
          )}
          {available && product.isNew && (
            <span className="bg-ivory/90 px-2 py-1 text-[0.58rem] uppercase tracking-[0.2em] sm:px-3 sm:text-[0.6rem] sm:tracking-[0.25em]">{t.common.new}</span>
          )}
          {available && product.compareAtPrice && (
            <span className="bg-ink px-2 py-1 text-[0.58rem] uppercase tracking-[0.2em] text-ivory sm:px-3 sm:text-[0.6rem] sm:tracking-[0.25em]">{t.common.offer}</span>
          )}
        </div>

        {available && (
          <div className="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 transition-all duration-500 ease-[var(--ease-luxe)] group-hover:translate-y-0 group-hover:opacity-100">
            <span className="block bg-ivory/95 py-3 text-center text-[0.65rem] uppercase tracking-[0.28em] backdrop-blur">
              {t.common.discover}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1 sm:mt-5 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <p className="truncate text-[0.6rem] uppercase tracking-[0.2em] text-muted sm:text-[0.62rem] sm:tracking-[0.25em]">{category ? categoryName(category, locale) : ""}</p>
          <h3 className={`mt-1 font-serif text-lg leading-snug sm:text-xl ${available ? "" : "text-muted line-through decoration-sold decoration-1"}`}>
            {name}
          </h3>
        </div>
        <div className="flex items-baseline gap-2 text-sm lg:block lg:text-end">
          <p className={`whitespace-nowrap ${available ? "" : "text-muted"}`}>{price(product.price)}</p>
          {product.compareAtPrice && <p className="whitespace-nowrap text-xs text-muted line-through">{price(product.compareAtPrice)}</p>}
        </div>
      </div>

      <div className="mt-2.5 flex gap-2 sm:mt-3" aria-label={t.common.colors}>
        {product.colors.map((c) => {
          const ok = isColorAvailable(product, c);
          const label = colorLabel(c, locale);
          return (
            <span
              key={c.name}
              title={`${label}${ok ? "" : ` — ${t.common.unavailable}`}`}
              className={`relative block h-3.5 w-3.5 rounded-full ring-1 ring-stone ring-offset-1 ring-offset-ivory ${ok ? "" : "crossed"}`}
            >
              <span className={`block h-full w-full rounded-full ${ok ? "" : "opacity-40 grayscale"}`} style={{ background: c.hex }} />
            </span>
          );
        })}
      </div>
    </Link>
  );
}
