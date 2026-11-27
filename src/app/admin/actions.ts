"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import type postgres from "postgres";
import { db } from "@/lib/server/db";
import { TAGS } from "@/lib/server/catalog";
import { assertAdmin, Unauthorized } from "@/lib/server/auth";
import { SESSION_COOKIE, SESSION_DAYS, adminConfigured, checkPassword, createSessionToken } from "@/lib/server/session";
import { deleteOrder, setOrderStatus, updateOrderNote } from "@/lib/server/orders";
import { isOrderStatus } from "@/lib/order-status";
import { CUTS, ONE_SIZE, isValidSize, normalizeSize, slugify, sortSizes, type Cut, type ProductColor, type Size } from "@/lib/products";
import { CITIES } from "@/lib/cities";

export type ActionResult = { ok: true; id?: number } | { ok: false; error: string; fields?: Record<string, string> };

// ——— Helpers ———

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "");
const line = (v: unknown, max: number) => text(v, max).replace(/\s+/g, " ");
const int = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);
/** Uploaded files: Vercel Blob (https) or local development uploads */
const isMediaUrl = (v: unknown): v is string => typeof v === "string" && v.length < 600 && (/^https:\/\/[^\s"'<>]+$/.test(v) || /^\/uploads\/[\w./-]+$/.test(v));

function refreshShop(tags: string[]) {
  for (const t of tags) updateTag(t);
  revalidatePath("/", "layout");
}

/** Runs a mutation: checks the session, turns errors into a message for the form. */
async function guarded(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    await assertAdmin();
    return await fn();
  } catch (err) {
    if (err instanceof Unauthorized) return { ok: false, error: err.message };
    const code = (err as { code?: string }).code;
    if (code === "23505") return { ok: false, error: "Cet identifiant (slug) est déjà utilisé.", fields: { slug: "Déjà utilisé" } };
    console.error("[admin]", err);
    return { ok: false, error: "Erreur du serveur. Réessayez dans un instant." };
  }
}

// ——— Login ———

const attempts = new Map<string, number[]>();

export async function login(_: unknown, form: FormData): Promise<{ error: string }> {
  if (!adminConfigured()) return { error: "ADMIN_PASSWORD n'est pas défini dans les variables d'environnement." };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 15 * 60_000);
  if (recent.length >= 8) return { error: "Trop de tentatives. Réessayez dans 15 minutes." };

  if (!(await checkPassword(String(form.get("password") ?? "")))) {
    attempts.set(ip, [...recent, now]);
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    return { error: "Mot de passe incorrect." };
  }
  attempts.delete(ip);
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ——— Categories ———

export interface CategoryInput {
  id?: number;
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  image?: string | null;
  cut: Cut;
  color: string;
}

export async function saveCategory(input: CategoryInput): Promise<ActionResult> {
  return guarded(async () => {
    const name = line(input.name, 80);
    const slug = slugify(line(input.slug, 80) || name);
    const fields: Record<string, string> = {};
    if (!name) fields.name = "Obligatoire";
    if (!slug) fields.slug = "Obligatoire";
    if (input.image && !isMediaUrl(input.image)) fields.image = "Image invalide";
    if (Object.keys(fields).length) return { ok: false, error: "Vérifiez les champs en rouge.", fields };

    const v = {
      slug,
      name,
      name_ar: line(input.nameAr, 80),
      description: line(input.description, 200),
      description_ar: line(input.descriptionAr, 200),
      image: input.image || null,
      cut: CUTS.includes(input.cut) ? input.cut : "classique",
      color: isHex(input.color) ? input.color : "#1C2541",
    };
    const sql = await db();
    let id = input.id;
    if (id) {
      await sql`update categories set ${sql(v)} where id = ${id}`;
    } else {
      const [{ max }] = await sql<{ max: number }[]>`select coalesce(max(position), -1)::int as max from categories`;
      [{ id }] = await sql<{ id: number }[]>`insert into categories ${sql({ ...v, position: max + 1 })} returning id`;
    }
    refreshShop([TAGS.catalog]);
    return { ok: true, id };
  });
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  return guarded(async () => {
    const sql = await db();
    await sql`delete from categories where id = ${id}`; // its products stay, without a category
    refreshShop([TAGS.catalog]);
    return { ok: true };
  });
}

export async function moveCategory(id: number, dir: -1 | 1): Promise<ActionResult> {
  return guarded(async () => {
    const sql = await db();
    await sql.begin(async (tx) => {
      const rows = await tx<{ id: number }[]>`select id from categories order by position, id for update`;
      const i = rows.findIndex((r) => r.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= rows.length) return;
      [rows[i], rows[j]] = [rows[j], rows[i]];
      for (const [pos, r] of rows.entries()) await tx`update categories set position = ${pos} where id = ${r.id}`;
    });
    refreshShop([TAGS.catalog]);
    return { ok: true };
  });
}

// ——— Products ———

export interface ProductInput {
  id?: number;
  slug: string;
  category: string;
  cut: Cut;
  name: string;
  nameAr: string;
  price: number | string;
  compareAtPrice: number | string | null;
  shortDescription: string;
  description: string;
  fabric: string;
  details: string[];
  ar: { shortDescription: string; description: string; fabric: string; details: string[] };
  sizes: Size[];
  colors: ProductColor[];
  isNew: boolean;
  featured: boolean;
  active: boolean;
}

/** Saves the size list offered in the product form (× removes a size, "+ Ajouter" adds one). Admin only: the shop doesn't read it. */
export async function saveSizeOptions(input: string[]): Promise<ActionResult> {
  return guarded(async () => {
    const typed = (Array.isArray(input) ? input : []).map((s) => normalizeSize(String(s)));
    const sizes = sortSizes([...new Set(typed)].filter((s) => isValidSize(s) && s !== ONE_SIZE)).slice(0, 40);
    const sql = await db();
    await sql`
      insert into settings (key, value) values ('size_options', ${sql.json(sizes)})
      on conflict (key) do update set value = excluded.value`;
    return { ok: true };
  });
}

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  return guarded(async () => {
    const fields: Record<string, string> = {};
    const name = line(input.name, 120);
    const slug = slugify(line(input.slug, 80) || name);
    const price = int(input.price);
    const compare = input.compareAtPrice === null || input.compareAtPrice === "" ? null : int(input.compareAtPrice);
    // Standard sizes and the admin's custom ones ("M/L"…), cleaned, without duplicates, in wearing order
    const typed = (Array.isArray(input.sizes) ? input.sizes : []).map((s) => normalizeSize(String(s))).filter(Boolean);
    const badSize = typed.find((s) => !isValidSize(s));
    const sizes = sortSizes([...new Set(typed)]).slice(0, 15);

    if (!name) fields.name = "Obligatoire";
    if (!slug) fields.slug = "Obligatoire";
    if (!Number.isInteger(price) || price < 1 || price > 1_000_000) fields.price = "Prix invalide";
    if (compare !== null && (!Number.isInteger(compare) || compare <= price)) fields.compareAtPrice = "Doit être supérieur au prix";
    if (badSize) fields.sizes = `Taille « ${badSize} » invalide : lettres et chiffres, séparés par « / » (ex. M/L)`;
    else if (!sizes.length) fields.sizes = "Choisissez au moins une taille";
    else if (sizes.includes(ONE_SIZE) && sizes.length > 1) fields.sizes = "« Taille unique » ne se combine pas avec d'autres tailles";

    const colors: ProductColor[] = [];
    const seen = new Set<string>();
    for (const [i, c] of (Array.isArray(input.colors) ? input.colors : []).slice(0, 20).entries()) {
      const cname = line(c?.name, 40);
      if (!cname) fields[`color${i}`] = "Nom de la couleur obligatoire";
      else if (seen.has(cname.toLowerCase())) fields[`color${i}`] = "Deux couleurs ont le même nom";
      seen.add(cname.toLowerCase());
      const stock: ProductColor["stock"] = {};
      for (const s of sizes) {
        const n = int(c?.stock?.[s] ?? 0);
        if (!Number.isInteger(n) || n < 0 || n > 99_999) fields[`color${i}`] = `Stock invalide (taille ${s})`;
        else stock[s] = n;
      }
      colors.push({
        name: cname,
        nameAr: line(c?.nameAr, 40),
        hex: isHex(String(c?.hex)) ? String(c.hex) : "#141414",
        images: (Array.isArray(c?.images) ? c.images : []).filter(isMediaUrl).slice(0, 12),
        stock,
      });
    }
    if (!colors.length) fields.colors = "Ajoutez au moins une couleur";
    if (Object.keys(fields).length) return { ok: false, error: "Vérifiez les champs en rouge.", fields };

    const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => line(x, 200)).filter(Boolean).slice(0, 20) : []);
    const sql = await db();
    const [cat] = input.category ? await sql<{ id: number }[]>`select id from categories where slug = ${input.category}` : [];
    const v = {
      slug,
      category_id: cat?.id ?? null,
      cut: CUTS.includes(input.cut) ? input.cut : "classique",
      name,
      name_ar: line(input.nameAr, 120),
      price,
      compare_at_price: compare,
      short_description: line(input.shortDescription, 300),
      description: text(input.description, 4000),
      fabric: line(input.fabric, 200),
      details: sql.json(list(input.details)),
      ar: sql.json({
        shortDescription: line(input.ar?.shortDescription, 300),
        description: text(input.ar?.description, 4000),
        fabric: line(input.ar?.fabric, 200),
        details: list(input.ar?.details),
      }),
      sizes: sql.json(sizes),
      colors: sql.json(colors as unknown as postgres.JSONValue),
      is_new: !!input.isNew,
      featured: !!input.featured,
      active: !!input.active,
    };
    let id = input.id;
    if (id) {
      await sql`update products set ${sql(v)}, updated_at = now() where id = ${id}`;
    } else {
      const [{ max }] = await sql<{ max: number }[]>`select coalesce(max(position), -1)::int as max from products`;
      [{ id }] = await sql<{ id: number }[]>`insert into products ${sql({ ...v, position: max + 1 })} returning id`;
    }
    refreshShop([TAGS.catalog]);
    return { ok: true, id };
  });
}

// ——— Sets (الأطقم): one abaya colour + one matching khimar colour, at the set's own price ———

export interface EnsembleInput {
  id?: number;
  slug: string;
  name: string;
  nameAr: string;
  abaya: { slug: string; color: string };
  khimar: { slug: string; color: string };
  price: number | string;
  shortDescription: string;
  ar: { shortDescription: string; description: string };
  /** The set's own photos (styled together); empty = the abaya's and khimar's photos are shown */
  images: string[];
  isNew: boolean;
  featured: boolean;
  active: boolean;
}

export async function saveEnsemble(input: EnsembleInput): Promise<ActionResult> {
  return guarded(async () => {
    const fields: Record<string, string> = {};
    const name = line(input.name, 120);
    const slug = slugify(line(input.slug, 80) || name);
    const price = int(input.price);
    if (!name) fields.name = "Obligatoire";
    if (!slug) fields.slug = "Obligatoire";
    if (!Number.isInteger(price) || price < 1 || price > 1_000_000) fields.price = "Prix invalide";

    const sql = await db();
    const pieces = await sql<{ slug: string; price: number; sizes: string[]; colors: ProductColor[]; bundle: unknown }[]>`
      select slug, price, sizes, colors, bundle from products where slug = any(${[input.abaya?.slug ?? "", input.khimar?.slug ?? ""]})`;
    const abaya = pieces.find((p) => p.slug === input.abaya?.slug && !p.bundle);
    const khimar = pieces.find((p) => p.slug === input.khimar?.slug && !p.bundle);
    const abayaColor = abaya?.colors.find((c) => c.name === input.abaya.color);
    const khimarColor = khimar?.colors.find((c) => c.name === input.khimar.color);
    if (!abaya || !abayaColor || abaya.sizes.includes(ONE_SIZE)) fields.abaya = "Choisissez une abaya et sa couleur";
    if (!khimar || !khimarColor || !khimar.sizes.includes(ONE_SIZE)) fields.khimar = "Choisissez un khimar (taille unique) et sa couleur";
    if (Object.keys(fields).length) return { ok: false, error: "Vérifiez les champs en rouge.", fields };

    const [cat] = await sql<{ id: number }[]>`select id from categories where slug = 'ensembles'`;
    const v = {
      slug,
      category_id: cat?.id ?? null,
      cut: "ensemble",
      name,
      name_ar: line(input.nameAr, 120),
      price,
      compare_at_price: null, // shown automatically: the abaya + khimar bought separately
      short_description: line(input.shortDescription, 300),
      description: "",
      fabric: "",
      details: sql.json([]),
      ar: sql.json({
        shortDescription: line(input.ar?.shortDescription, 300),
        description: text(input.ar?.description, 4000),
        fabric: "",
        details: [],
      }),
      sizes: sql.json([]), // worked out from the abaya when the catalogue is read
      // One colour holding the set's own photos; its name and stock are worked out from the pieces
      colors: sql.json([
        { name: "Ensemble", nameAr: "", hex: abayaColor!.hex, images: (Array.isArray(input.images) ? input.images : []).filter(isMediaUrl).slice(0, 12), stock: {} },
      ] as unknown as postgres.JSONValue),
      bundle: sql.json({ abaya: { slug: abaya!.slug, color: abayaColor!.name }, khimar: { slug: khimar!.slug, color: khimarColor!.name } }),
      is_new: !!input.isNew,
      featured: !!input.featured,
      active: !!input.active,
    };
    let id = input.id;
    if (id) {
      await sql`update products set ${sql(v)}, updated_at = now() where id = ${id}`;
    } else {
      const [{ max }] = await sql<{ max: number }[]>`select coalesce(max(position), -1)::int as max from products`;
      [{ id }] = await sql<{ id: number }[]>`insert into products ${sql({ ...v, position: max + 1 })} returning id`;
    }
    refreshShop([TAGS.catalog]);
    return { ok: true, id };
  });
}

export async function setProductActive(id: number, active: boolean): Promise<ActionResult> {
  return guarded(async () => {
    const sql = await db();
    await sql`update products set active = ${active}, updated_at = now() where id = ${id}`;
    refreshShop([TAGS.catalog]);
    return { ok: true };
  });
}

export async function deleteProduct(id: number): Promise<ActionResult> {
  return guarded(async () => {
    const sql = await db();
    await sql`delete from products where id = ${id}`; // past orders keep their own copy of the lines
    refreshShop([TAGS.catalog]);
    return { ok: true };
  });
}

// ——— Reviews ———

export interface ReviewInput {
  id?: number;
  name: string;
  city: string;
  date: string;
  rating: number;
  lang: "fr" | "ar";
  text: string;
  photos: string[];
  voice: { src: string; duration: number; transcript: string } | null;
  productSlug: string;
  productColor: string;
  productSize: string;
  verified: boolean;
  published: boolean;
}

export async function saveReview(input: ReviewInput): Promise<ActionResult> {
  return guarded(async () => {
    const fields: Record<string, string> = {};
    const name = line(input.name, 60);
    const body = text(input.text, 3000);
    const photos = (Array.isArray(input.photos) ? input.photos : []).filter(isMediaUrl).slice(0, 10);
    const voice =
      input.voice && isMediaUrl(input.voice.src)
        ? { src: input.voice.src, duration: Math.max(1, Math.round(Number(input.voice.duration) || 1)), transcript: text(input.voice.transcript, 2000) || undefined }
        : null;
    const rating = Math.round(Number(input.rating));
    const date = /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : new Date().toISOString().slice(0, 10);

    if (!name) fields.name = "Obligatoire";
    if (!(rating >= 1 && rating <= 5)) fields.rating = "Note de 1 à 5";
    if (!body && !photos.length && !voice) fields.content = "Ajoutez un texte, des photos ou un message vocal";
    if (Object.keys(fields).length) return { ok: false, error: "Vérifiez les champs en rouge.", fields };

    const v = {
      name,
      city: CITIES.some((c) => c.fr === input.city) ? input.city : "",
      date,
      rating,
      lang: input.lang === "ar" ? "ar" : "fr",
      text: body || null,
      photos: null as unknown,
      voice: null as unknown,
      product_slug: line(input.productSlug, 80) || null,
      product_color: line(input.productColor, 40) || null,
      product_size: isValidSize(normalizeSize(String(input.productSize ?? ""))) ? normalizeSize(String(input.productSize)) : null,
      verified: !!input.verified,
      published: !!input.published,
    };
    const sql = await db();
    v.photos = sql.json(photos.map((src) => ({ src })));
    v.voice = voice ? sql.json(voice) : null;
    let id = input.id;
    if (id) await sql`update reviews set ${sql(v as Record<string, postgres.ParameterOrJSON<never>>)} where id = ${id}`;
    else [{ id }] = await sql<{ id: number }[]>`insert into reviews ${sql(v as Record<string, postgres.ParameterOrJSON<never>>)} returning id`;
    refreshShop([TAGS.reviews]);
    return { ok: true, id };
  });
}

export async function setReviewPublished(id: number, published: boolean): Promise<ActionResult> {
  return guarded(async () => {
    const sql = await db();
    await sql`update reviews set published = ${published} where id = ${id}`;
    refreshShop([TAGS.reviews]);
    return { ok: true };
  });
}

export async function deleteReview(id: number): Promise<ActionResult> {
  return guarded(async () => {
    const sql = await db();
    await sql`delete from reviews where id = ${id}`;
    refreshShop([TAGS.reviews]);
    return { ok: true };
  });
}

// ——— Orders ———

export async function changeOrderStatus(id: number, status: string): Promise<ActionResult> {
  return guarded(async () => {
    if (!isOrderStatus(status)) return { ok: false, error: "Statut inconnu." };
    const r = await setOrderStatus(id, status);
    if (!r.ok) return r;
    refreshShop([TAGS.catalog]); // stock may have changed
    return { ok: true };
  });
}

export async function saveOrderNote(id: number, note: string): Promise<ActionResult> {
  return guarded(async () => {
    await updateOrderNote(id, text(note, 2000));
    return { ok: true };
  });
}

export async function removeOrder(id: number): Promise<ActionResult> {
  return guarded(async () => {
    await deleteOrder(id);
    refreshShop([TAGS.catalog]);
    return { ok: true };
  });
}
