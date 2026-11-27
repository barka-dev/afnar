import type { Locale } from "@/i18n/config";

/**
 * Catalogue types and helpers (shared by the shop and the admin).
 * The data itself lives in the database and is edited in the admin dashboard (/admin).
 */

/** Illustration style used when a product or category has no photo yet ("khimar" and "ensemble" for khimars and sets) */
export type Cut = "classique" | "brodee" | "papillon" | "kimono" | "khimar" | "ensemble";
export const CUTS: Cut[] = ["classique", "brodee", "papillon", "kimono", "khimar", "ensemble"];

/**
 * Sizes are written the way Moroccan shops write them: S, M, L, XL, XXL (STANDARD_SIZES), plus any custom size the
 * admin adds to a product, such as "M/L" or "XL/XXL". "TU" (taille unique / مقاس موحّد) is for one-size products
 * such as khimars and never goes with other sizes. A size is its own id in the stock, the cart and orders.
 * (Until November 2026 sizes were abaya lengths 52–60; db.ts converted them once with LENGTH_TO_LETTER.)
 */
export const STANDARD_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export const ONE_SIZE = "TU";
export type Size = string;

/** The old abaya lengths and the letter size each one became (one to one, so no stock was merged). */
export const LENGTH_TO_LETTER: Record<string, string> = { "52": "S", "54": "M", "56": "L", "58": "XL", "60": "XXL" };

/** Cleans a size typed in the admin: "  xl / xxl " -> "XL/XXL". */
export const normalizeSize = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

/** Letters, digits and "/" or "-" between parts ("M", "XL/XXL", "3XL"), at most 12 characters. */
export const isValidSize = (s: string) => s.length <= 12 && /^[A-Z0-9]+([/-][A-Z0-9]+)*$/.test(s);

const LETTER_RANK = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL", "5XL"];
/** Sort key: by the first part's letter size ("M/L" just after "M"), numbers after letters, unknown sizes last. */
function sizeRank(s: string): number {
  const parts = s.split(/[/-]/);
  const r = LETTER_RANK.indexOf(parts[0]);
  const base = r >= 0 ? r * 10 : /^\d+$/.test(parts[0]) ? 1000 + Number(parts[0]) : 100000;
  return base + (parts.length > 1 ? 5 : 0);
}
/** Sizes in wearing order: S, M, M/L, L, XL, XL/XXL, XXL… */
export const sortSizes = (sizes: string[]) => [...sizes].sort((a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b));

/** True for a one-size product (khimars): no size to choose in the shop. */
export const isOneSize = (p: Pick<Product, "sizes">) => p.sizes.length === 1 && p.sizes[0] === ONE_SIZE;

/** How a size is written: "XL", or the one-size label ("مقاس موحّد" in the shop, "Taille unique" in the admin). */
export const sizeLabel = (size: string, oneSize: string) => (size === ONE_SIZE ? oneSize : size);

/**
 * A set (الأطقم): one abaya colour + one matching khimar colour, sold together at the set's own price.
 * Stored on the set product; its sizes, colour and stock are worked out from the two pieces (src/lib/server/catalog.ts).
 */
export interface Bundle {
  abaya: { slug: string; color: string };
  khimar: { slug: string; color: string };
}

/** A piece of a set, resolved from the catalogue, to show "this set contains…" on the product page. */
export interface BundlePart {
  role: "abaya" | "khimar";
  slug: string;
  name: string;
  nameAr: string;
  color: string;
  colorAr: string;
  price: number;
}

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
  /** Set only: the abaya + khimar it is made of (see Bundle) */
  bundle?: Bundle;
  /** Set only: its two pieces as found in the catalogue (absent if a piece was deleted) */
  bundleParts?: BundlePart[];
  /** Set only: the set's own photos (the shop falls back to the pieces' photos when empty) */
  bundleImages?: string[];
}

/** Abaya length and recommended wearer height for each standard size, in cm (same values as the old lengths 52–60). */
export const SIZE_GUIDE: { size: (typeof STANDARD_SIZES)[number]; lengthCm: number; heightCm: [number, number] }[] = [
  { size: "S", lengthCm: 132, heightCm: [150, 155] },
  { size: "M", lengthCm: 137, heightCm: [155, 160] },
  { size: "L", lengthCm: 142, heightCm: [160, 165] },
  { size: "XL", lengthCm: 147, heightCm: [165, 170] },
  { size: "XXL", lengthCm: 152, heightCm: [170, 178] },
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

/**
 * Categories with no product on the shop yet ("coming soon"). `products` is the shop list (active products),
 * so a category with only hidden products also counts as coming soon. Updates by itself as products are added.
 */
export function comingSoonSlugs(categories: Pick<Category, "slug">[], products: Pick<Product, "category">[]): Set<string> {
  const filled = new Set(products.map((p) => p.category));
  return new Set(categories.map((c) => c.slug).filter((s) => !filled.has(s)));
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
