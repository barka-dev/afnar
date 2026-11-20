"use client";

import { createContext, useContext, useMemo } from "react";
import type { Category, Product } from "@/lib/products";

interface CatalogValue {
  products: Product[];
  categories: Category[];
  getProduct: (slug: string | undefined) => Product | undefined;
  getCategory: (slug: string | undefined) => Category | undefined;
}

const CatalogContext = createContext<CatalogValue | null>(null);

/** The shop's products and categories (loaded from the database by the layout), for client components. */
export function CatalogProvider({ products, categories, children }: { products: Product[]; categories: Category[]; children: React.ReactNode }) {
  const value = useMemo<CatalogValue>(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const cats = new Map(categories.map((c) => [c.slug, c]));
    return {
      products,
      categories,
      getProduct: (slug) => (slug ? bySlug.get(slug) : undefined),
      getCategory: (slug) => (slug ? cats.get(slug) : undefined),
    };
  }, [products, categories]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside CatalogProvider");
  return ctx;
}
