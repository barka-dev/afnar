import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import { CUTS, ONE_SIZE, STANDARD_SIZES, isValidSize, type Bundle, type Category, type Cut, type Product } from "@/lib/products";
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
    sizes: (Array.isArray(r.sizes) ? (r.sizes as unknown[]) : []).filter((s): s is string => typeof s === "string" && isValidSize(s)),
    colors: Array.isArray(r.colors) ? (r.colors as Product["colors"]) : [],
    isNew: !!r.is_new,
    featured: !!r.featured,
    active: r.active !== false,
    position: Number(r.position ?? 0),
    bundle: toBundle(r.bundle),
  };
}

function toBundle(v: unknown): Bundle | undefined {
  const b = v as Partial<Bundle> | null;
  if (!b?.abaya?.slug || !b.abaya.color || !b.khimar?.slug || !b.khimar.color) return undefined;
  return { abaya: { slug: b.abaya.slug, color: b.abaya.color }, khimar: { slug: b.khimar.slug, color: b.khimar.color } };
}

/**
 * Works out each set from its two pieces: the abaya's sizes, one colour named "<abaya colour> + <khimar colour>",
 * stock per size = min(abaya stock in that size, khimar stock), photos = the set's own photos or else the pieces'.
 * The crossed-out price defaults to the two pieces bought separately. A set whose piece is gone has no stock.
 */
function resolveBundles(all: Product[]): Product[] {
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  return all.map((p) => {
    if (!p.bundle) return p;
    const abaya = bySlug.get(p.bundle.abaya.slug);
    const khimar = bySlug.get(p.bundle.khimar.slug);
    const ac = abaya?.colors.find((c) => c.name === p.bundle!.abaya.color);
    const kc = khimar?.colors.find((c) => c.name === p.bundle!.khimar.color);
    const own = p.colors[0];
    const bundleImages = own?.images ?? [];
    if (!abaya || !khimar || !ac || !kc) {
      return { ...p, sizes: [], colors: own ? [{ ...own, stock: {} }] : [], bundleParts: undefined, bundleImages };
    }
    const sizes = abaya.sizes.filter((s) => s !== ONE_SIZE);
    const khimarStock = khimar.sizes.reduce((n, s) => n + (kc.stock[s] ?? 0), 0);
    const stock: Product["colors"][number]["stock"] = {};
    for (const s of sizes) stock[s] = Math.min(ac.stock[s] ?? 0, khimarStock);
    const images = own?.images?.length ? own.images : [...(ac.images ?? []), ...(kc.images ?? [])];
    const separate = abaya.price + khimar.price;
    return {
      ...p,
      sizes,
      colors: [
        {
          name: `${ac.name} + ${kc.name}`,
          nameAr: `${ac.nameAr || ac.name} + ${kc.nameAr || kc.name}`,
          hex: ac.hex,
          images,
          stock,
        },
      ],
      compareAtPrice: p.compareAtPrice ?? (separate > p.price ? separate : undefined),
      bundleImages,
      bundleParts: [
        { role: "abaya", slug: abaya.slug, name: abaya.name, nameAr: abaya.nameAr, color: ac.name, colorAr: ac.nameAr, price: abaya.price },
        { role: "khimar", slug: khimar.slug, name: khimar.name, nameAr: khimar.nameAr, color: kc.name, colorAr: kc.nameAr, price: khimar.price },
      ],
    };
  });
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
  // All products are read so that sets can find their pieces even if a piece is hidden; filtered afterwards.
  const rows = await sql`
    select p.*, c.slug as category_slug from products p
    left join categories c on c.id = p.category_id
    order by p.position, p.id`;
  const products = resolveBundles(rows.map(toProduct));
  return opts.activeOnly ? products.filter((p) => p.active) : products;
}

/** The size list offered in the admin product form (Admin → Produits): S to XXL until the team edits it. */
export async function readSizeOptions(): Promise<string[]> {
  const sql = await db();
  const [row] = await sql<{ value: unknown }[]>`select value from settings where key = 'size_options'`;
  if (!Array.isArray(row?.value)) return [...STANDARD_SIZES];
  return row.value.filter((s): s is string => typeof s === "string" && isValidSize(s) && s !== ONE_SIZE);
}

export async function readReviews(opts: { publishedOnly?: boolean } = {}): Promise<Review[]> {
  const sql = await db();
  const rows = await sql`
    select * from reviews where ${opts.publishedOnly ? sql`published` : sql`true`}
    order by date desc, id desc`;
  return rows.map(toReview);
}

// ——— Cached reads (shop) ———

// Cache keys carry a version: bump it when the shape of the cached data changes (v3: sets, regrouped categories;
// v4: letter sizes), so a deployment never serves entries cached by the previous code (Vercel keeps this cache across deployments).
export const getCategories = unstable_cache(() => readCategories(), ["categories-v4"], { tags: [TAGS.catalog] });
export const getProducts = unstable_cache(() => readProducts({ activeOnly: true }), ["products-v4"], { tags: [TAGS.catalog] });
export const getReviews = unstable_cache(() => readReviews({ publishedOnly: true }), ["reviews"], { tags: [TAGS.reviews] });

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}
