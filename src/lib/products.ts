import type { Locale } from "@/i18n/config";

/**
 * Catalogue types and helpers (shared by the shop and the admin).
 * The data itself lives in the database and is edited in the admin dashboard (/admin).
 */

/** Illustration style used when a product or category has no photo yet */
export type Cut = "classique" | "brodee" | "papillon" | "kimono";
export const CUTS: Cut[] = ["classique", "brodee", "papillon", "kimono"];

export const SIZES = ["52", "54", "56", "58", "60"] as const;
export type Size = (typeof SIZES)[number];

export interface ProductColor {
  /** French name — also the colour's id in the cart and in orders */
  name: string;
  nameAr: string;
  hex: string;
  /** Photos for this colour. Falls back to an illustration when empty. */
  images?: string[];
  /** Units in stock per size. Missing or 0 = unavailable. */
  stock: Partial<Record<Size, number>>;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  /** Photo shown on the home page; falls back to an illustration */
  image?: string;
  /** Illustration style + colour when there is no photo */
  cut: Cut;
  color: string;
  position: number;
}

export interface Product {
  id: number;
  slug: string;
  /** Category slug ("" when the product has no category) */
  category: string;
  /** Illustration style when the product has no photos */
  cut: Cut;
  name: string;
  nameAr: string;
  price: number;
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  fabric: string;
  details: string[];
  /** Arabic copy (the French fields above are the default) */
  ar: { shortDescription: string; description: string; fabric: string; details: string[] };
  sizes: Size[];
  colors: ProductColor[];
  isNew?: boolean;
  featured?: boolean;
  /** Hidden from the shop when false */
  active: boolean;
  position: number;
}

/** Abaya length and recommended wearer height, in cm. */
export const SIZE_GUIDE: { size: Size; lengthCm: number; heightCm: [number, number] }[] = [
  { size: "52", lengthCm: 132, heightCm: [150, 155] },
  { size: "54", lengthCm: 137, heightCm: [155, 160] },
  { size: "56", lengthCm: 142, heightCm: [160, 165] },
  { size: "58", lengthCm: 147, heightCm: [165, 170] },
  { size: "60", lengthCm: 152, heightCm: [170, 178] },
];

// ——— Helpers ———

export function stockFor(color: ProductColor, size: Size): number {
  return color.stock[size] ?? 0;
}

export function isColorAvailable(product: Product, color: ProductColor): boolean {
  return product.sizes.some((s) => stockFor(color, s) > 0);
}

export function isProductAvailable(product: Product): boolean {
  return product.colors.some((c) => isColorAvailable(product, c));
}

/*
 * Shop copy is Arabic. The French fields (name, description…) stay in the database as internal reference
 * (admin, Telegram, colour ids) and are only shown as a fallback when an Arabic field is still empty.
 * `_locale` is kept so the call sites stay ready if another language is ever added back.
 */

/** Product copy shown in the shop. */
export function localizeProduct(p: Product, _locale: Locale) {
  return {
    name: p.nameAr || p.name,
    shortDescription: p.ar.shortDescription || p.shortDescription,
    description: p.ar.description || p.description,
    fabric: p.ar.fabric || p.fabric,
    details: p.ar.details.length ? p.ar.details : p.details,
  };
}

export function productName(p: Product, _locale: Locale): string {
  return p.nameAr || p.name;
}

export function colorLabel(c: Pick<ProductColor, "name" | "nameAr">, _locale: Locale): string {
  return c.nameAr || c.name;
}

export function categoryName(c: Pick<Category, "name" | "nameAr">, _locale: Locale): string {
  return c.nameAr || c.name;
}

export function categoryDescription(c: Pick<Category, "description" | "descriptionAr">, _locale: Locale): string {
  return c.descriptionAr || c.description;
}

export function totalStock(p: Pick<Product, "colors" | "sizes">): number {
  return p.colors.reduce((n, c) => n + p.sizes.reduce((m, s) => m + (c.stock[s] ?? 0), 0), 0);
}

/** "Abaya Nour" -> "abaya-nour" */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
