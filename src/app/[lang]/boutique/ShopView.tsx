"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { categoryDescription, categoryName, isProductAvailable } from "@/lib/products";
import { useCatalog } from "@/context/CatalogContext";
import { useI18n } from "@/i18n/I18nProvider";

type Sort = "featured" | "price-asc" | "price-desc" | "new";

export default function ShopView({ initialCategory }: { initialCategory: string }) {
  const { t, href, locale } = useI18n();
  const { products: all, categories, getCategory } = useCatalog();
  const sh = t.shop;
  const [category, setCategory] = useState<string>(initialCategory);
  const [sort, setSort] = useState<Sort>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  const chipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCategory(initialCategory), [initialCategory]);

  // Keep the active category chip visible in the horizontally scrolling row (phones)
  useEffect(() => {
    const row = chipsRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !chip) return;
    const rowBox = row.getBoundingClientRect();
    const chipBox = chip.getBoundingClientRect();
    if (chipBox.left < rowBox.left || chipBox.right > rowBox.right) {
      row.scrollBy({ left: chipBox.left - rowBox.left - (rowBox.width - chipBox.width) / 2, behavior: "smooth" });
    }
  }, [category]);

  const selectCategory = (c: string) => {
    setCategory(c);
    const url = href(c === "all" ? "/boutique" : `/boutique?categorie=${c}`);
    window.history.replaceState(null, "", url);
  };

  const products = useMemo(() => {
    let list = all.filter((p) => (category === "all" || p.category === category) && (!inStockOnly || isProductAvailable(p)));
    list = [...list].sort((a, b) => {
      // sold-out products always last
      const av = Number(isProductAvailable(b)) - Number(isProductAvailable(a));
      if (av !== 0) return av;
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "new") return Number(!!b.isNew) - Number(!!a.isNew);
      return Number(!!b.featured) - Number(!!a.featured);
    });
    return list;
  }, [all, category, sort, inStockOnly]);

  const cat = category === "all" ? undefined : getCategory(category);
  const current = cat ? { label: categoryName(cat, locale), description: categoryDescription(cat, locale) } : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-10">
      <section className="py-10 text-center sm:py-16 md:py-24">
        <p className="eyebrow animate-fade-in">{sh.eyebrow}</p>
        <h1 key={category} className="mt-3 animate-fade-in font-serif text-4xl font-light sm:mt-4 sm:text-5xl md:text-6xl">
          {current ? current.label : sh.allTitle}
        </h1>
        <p key={`d-${category}`} className="mx-auto mt-4 max-w-md animate-fade-in text-sm text-muted">
          {current ? current.description : sh.allDescription}
        </p>
      </section>

      <div className="sticky top-16 z-20 -mx-4 flex flex-col gap-2 border-y border-stone/70 bg-ivory/90 py-2 backdrop-blur-md sm:-mx-5 md:-mx-10 md:flex-row md:items-center md:justify-between md:gap-4 md:px-10 md:py-4">
        <div ref={chipsRef} className="no-scrollbar flex snap-x gap-1 overflow-x-auto scroll-px-4 px-4 sm:px-5 md:px-0">
          {[{ slug: "all" as const, label: sh.all }, ...categories.map((c) => ({ slug: c.slug, label: categoryName(c, locale) }))].map((c) => (
            <button
              key={c.slug}
              onClick={() => selectCategory(c.slug)}
              aria-pressed={category === c.slug}
              className={`min-h-10 shrink-0 snap-start whitespace-nowrap px-4 py-2 text-[0.65rem] uppercase tracking-[0.22em] transition-colors duration-300 ${
                category === c.slug ? "bg-ink text-ivory" : "text-muted hover:text-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-6 px-4 text-[0.65rem] uppercase tracking-[0.2em] sm:px-5 md:justify-end md:px-0">
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="h-4 w-4 accent-[#1a1714]"
            />
            {sh.inStock}
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="min-h-10 cursor-pointer bg-transparent text-[16px] uppercase tracking-[0.12em] outline-none lg:text-[0.65rem] lg:tracking-[0.2em]"
            aria-label={sh.sort}
          >
            <option value="featured">{sh.sortFeatured}</option>
            <option value="new">{sh.sortNew}</option>
            <option value="price-asc">{sh.sortPriceAsc}</option>
            <option value="price-desc">{sh.sortPriceDesc}</option>
          </select>
        </div>
      </div>

      <p className="mt-5 text-xs text-muted sm:mt-8">{sh.count(products.length)}</p>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-10 sm:mt-6 sm:gap-x-5 sm:gap-y-14 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4 xl:gap-x-8">
        {products.map((p, i) => (
          <Reveal key={`${category}-${p.slug}`} delay={(i % 4) * 90}>
            <ProductCard product={p} priority={i < 4} />
          </Reveal>
        ))}
      </div>
      {products.length === 0 && <p className="py-24 text-center text-muted">{sh.noResults}</p>}
    </div>
  );
}
