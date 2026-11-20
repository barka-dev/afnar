import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import { CUTS, SIZES, type Category, type Cut, type Product, type Size } from "@/lib/products";
import type { Review } from "@/lib/reviews";

/** Cache tags: the admin refreshes them after every change (see src/app/admin/actions.ts). */
export const TAGS = { catalog: "catalog", reviews: "reviews" } as const;

type Row = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const cut = (v: unknown): Cut => (CUTS.includes(v as Cut) ? (v as Cut) : "classique");

export function toCategory(r: Row): Category {
  return {
    id: Number(r.id),
    slug: str(r.slug),
    name: str(r.name),
    nameAr: str(r.name_ar),
    description: str(r.description),
    descriptionAr: str(r.description_ar),
    image: str(r.image) || undefined,
    cut: cut(r.cut),
    color: str(r.color) || "#1C2541",
    position: Number(r.position ?? 0),
  };
}

export function toProduct(r: Row): Product {
  const ar = (r.ar ?? {}) as Partial<Product["ar"]>;
  return {
    id: Number(r.id),
    slug: str(r.slug),
    category: str(r.category_slug),
    cut: cut(r.cut),
    name: str(r.name),
    nameAr: str(r.name_ar),
    price: Number(r.price),
    compareAtPrice: r.compare_at_price == null ? undefined : Number(r.compare_at_price),
    shortDescription: str(r.short_description),
    description: str(r.description),
    fabric: str(r.fabric),
    details: Array.isArray(r.details) ? (r.details as string[]) : [],
    ar: { shortDescription: ar.shortDescription ?? "", description: ar.description ?? "", fabric: ar.fabric ?? "", details: ar.details ?? [] },
    sizes: (Array.isArray(r.sizes) ? (r.sizes as Size[]) : []).filter((s) => SIZES.includes(s)),
    colors: Array.isArray(r.colors) ? (r.colors as Product["colors"]) : [],
    isNew: !!r.is_new,
    featured: !!r.featured,
    active: r.active !== false,
    position: Number(r.position ?? 0),
  };
}

export function toReview(r: Row): Review {
  const d = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : str(r.date).slice(0, 10);
  return {
    id: String(r.id),
    name: str(r.name),
    city: str(r.city),
    date: d,
    rating: Math.min(5, Math.max(1, Number(r.rating))) as Review["rating"],
    lang: r.lang === "ar" ? "ar" : "fr",
    text: str(r.text) || undefined,
    photos: Array.isArray(r.photos) && r.photos.length ? (r.photos as Review["photos"]) : undefined,
    voice: (r.voice as Review["voice"]) ?? undefined,
    product: r.product_slug ? { slug: str(r.product_slug), color: str(r.product_color) || undefined, size: str(r.product_size) || undefined } : undefined,
    verified: !!r.verified,
    published: r.published !== false,
  };
}

// ——— Uncached reads (admin) ———

export async function readCategories(): Promise<Category[]> {
  const sql = await db();
  return (await sql`select * from categories order by position, id`).map(toCategory);
}

export async function readProducts(opts: { activeOnly?: boolean } = {}): Promise<Product[]> {
  const sql = await db();
  const rows = await sql`
    select p.*, c.slug as category_slug from products p
    left join categories c on c.id = p.category_id
    where ${opts.activeOnly ? sql`p.active` : sql`true`}
    order by p.position, p.id`;
  return rows.map(toProduct);
}

export async function readReviews(opts: { publishedOnly?: boolean } = {}): Promise<Review[]> {
  const sql = await db();
  const rows = await sql`
    select * from reviews where ${opts.publishedOnly ? sql`published` : sql`true`}
    order by date desc, id desc`;
  return rows.map(toReview);
}

// ——— Cached reads (shop) ———

export const getCategories = unstable_cache(() => readCategories(), ["categories"], { tags: [TAGS.catalog] });
export const getProducts = unstable_cache(() => readProducts({ activeOnly: true }), ["products"], { tags: [TAGS.catalog] });
export const getReviews = unstable_cache(() => readReviews({ publishedOnly: true }), ["reviews"], { tags: [TAGS.reviews] });

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}
