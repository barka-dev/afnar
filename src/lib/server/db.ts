import "server-only";
import postgres from "postgres";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "./seed-data";
import { LENGTH_TO_LETTER } from "@/lib/products";

/**
 * Postgres connection (Neon on Vercel). Set DATABASE_URL in .env.local / Vercel settings.
 * Tables are created automatically on first use, and the original catalogue is imported into an empty database.
 */

export class DatabaseNotConfigured extends Error {
  constructor() {
    super("DATABASE_URL is not set. Create a Neon database (see README → Admin dashboard) and add DATABASE_URL to .env.local.");
  }
}

type Sql = postgres.Sql<{}>;

// __afnarSchemaV4: the migration promise is kept per process; the version in its name makes a running dev server
// (and every new deployment) run migrate() again after a schema change. Bump it with each change to migrate().
const g = globalThis as unknown as { __afnarSql?: Sql; __afnarSchemaV4?: Promise<void> };

function connect(): Sql {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new DatabaseNotConfigured();
  if (!g.__afnarSql) {
    g.__afnarSql = postgres(url, {
      // serverless: few connections per instance; Neon's pooled URL does the rest
      max: process.env.VERCEL ? 2 : 5,
      idle_timeout: 20,
      connect_timeout: 15,
      // required behind Neon's connection pooler (PgBouncer, transaction mode)
      prepare: false,
      onnotice: () => {},
    });
  }
  return g.__afnarSql;
}

/** Ready-to-use connection (schema created and seeded). */
export async function db(): Promise<Sql> {
  const sql = connect();
  g.__afnarSchemaV4 ??= migrate(sql).catch((err) => {
    g.__afnarSchemaV4 = undefined; // retry on next call
    throw err;
  });
  await g.__afnarSchemaV4;
  return sql;
}

async function migrate(sql: Sql) {
  await sql.begin(async (tx) => {
    // Several build workers / serverless instances may start at once: only one migrates.
    await tx`select pg_advisory_xact_lock(812345001)`;

    await tx`
      create table if not exists categories (
        id serial primary key,
        slug text not null unique,
        name text not null,
        name_ar text not null default '',
        description text not null default '',
        description_ar text not null default '',
        image text,
        cut text not null default 'classique',
        color text not null default '#1C2541',
        position int not null default 0,
        created_at timestamptz not null default now()
      )`;
    await tx`
      create table if not exists products (
        id serial primary key,
        slug text not null unique,
        category_id int references categories(id) on delete set null,
        cut text not null default 'classique',
        name text not null,
        name_ar text not null default '',
        price int not null,
        compare_at_price int,
        short_description text not null default '',
        description text not null default '',
        fabric text not null default '',
        details jsonb not null default '[]',
        ar jsonb not null default '{}',
        sizes jsonb not null default '[]',
        colors jsonb not null default '[]',
        is_new boolean not null default false,
        featured boolean not null default false,
        active boolean not null default true,
        position int not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )`;
    await tx`
      create table if not exists reviews (
        id serial primary key,
        name text not null,
        city text not null default '',
        date date not null default current_date,
        rating int not null check (rating between 1 and 5),
        lang text not null default 'ar',
        text text,
        photos jsonb not null default '[]',
        voice jsonb,
        product_slug text,
        product_color text,
        product_size text,
        verified boolean not null default true,
        published boolean not null default true,
        created_at timestamptz not null default now()
      )`;
    await tx`
      create table if not exists orders (
        id serial primary key,
        ref text not null unique,
        status text not null default 'new',
        locale text not null default 'ar',
        full_name text not null,
        phone text not null,
        city text not null,
        address text not null,
        note text,
        lines jsonb not null,
        subtotal int not null,
        shipping int not null,
        total int not null,
        stock_reserved boolean not null default true,
        notified boolean not null default false,
        admin_note text not null default '',
        history jsonb not null default '[]',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )`;
    await tx`create index if not exists orders_created_idx on orders (created_at desc)`;
    await tx`create index if not exists orders_status_idx on orders (status)`;
    // Sets (الأطقم): the abaya + khimar a set is made of
    await tx`alter table products add column if not exists bundle jsonb`;

    // First start: import the original catalogue
    const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from categories`;
    if (n === 0) {
      const ids = new Map<string, number>();
      for (const [i, c] of SEED_CATEGORIES.entries()) {
        const [row] = await tx<{ id: number }[]>`
          insert into categories (slug, name, name_ar, description, description_ar, cut, color, position)
          values (${c.slug}, ${c.name}, ${c.nameAr}, ${c.description}, ${c.descriptionAr}, ${c.slug}, ${c.color}, ${i})
          returning id`;
        ids.set(c.slug, row.id);
      }
      for (const [i, p] of SEED_PRODUCTS.entries()) {
        await tx`
          insert into products (slug, category_id, cut, name, name_ar, price, compare_at_price, short_description, description,
                                fabric, details, ar, sizes, colors, is_new, featured, position)
          values (${p.slug}, ${ids.get(p.cut) ?? null}, ${p.cut}, ${p.name}, ${p.nameAr}, ${p.price}, ${p.compareAtPrice ?? null},
                  ${p.shortDescription}, ${p.description}, ${p.fabric}, ${tx.json(p.details)}, ${tx.json(p.ar)},
                  ${tx.json([...p.sizes])}, ${tx.json(p.colors as postgres.JSONValue)}, ${!!p.isNew}, ${!!p.featured}, ${i})`;
      }
    }

    await regroupCategories(tx);

    // Small admin settings (e.g. "size_options": the size list of the product form)
    await tx`create table if not exists settings (key text primary key, value jsonb not null)`;

    // One-time steps that must never run twice are recorded here
    await tx`create table if not exists app_migrations (name text primary key, done_at timestamptz not null default now())`;
    await runOnce(tx, "letter-sizes", convertLengthsToLetters);
  });
}

async function runOnce(tx: postgres.TransactionSql<{}>, name: string, step: (tx: postgres.TransactionSql<{}>) => Promise<void>) {
  const [done] = await tx`select 1 from app_migrations where name = ${name}`;
  if (done) return;
  await step(tx);
  await tx`insert into app_migrations (name) values (${name})`;
}

/**
 * Sizes switch from abaya lengths (52–60) to letter sizes (November 2026): each length becomes one letter
 * (LENGTH_TO_LETTER, one to one, so the stock moves unchanged), in the products' sizes and each colour's stock.
 * Recorded in app_migrations so that a custom size typed later (even a number) is never converted.
 * Past orders keep the size they were placed in.
 */
async function convertLengthsToLetters(tx: postgres.TransactionSql<{}>) {
  const conv = (s: string) => LENGTH_TO_LETTER[s] ?? s;
  const rows = await tx<{ id: number; sizes: string[]; colors: { stock?: Record<string, number> }[] }[]>`select id, sizes, colors from products`;
  let n = 0;
  for (const r of rows) {
    const sizes = Array.isArray(r.sizes) ? r.sizes : [];
    const colors = Array.isArray(r.colors) ? r.colors : [];
    const touched = sizes.some((s) => s in LENGTH_TO_LETTER) || colors.some((c) => Object.keys(c.stock ?? {}).some((s) => s in LENGTH_TO_LETTER));
    if (!touched) continue;
    const newColors = colors.map((c) => ({ ...c, stock: Object.fromEntries(Object.entries(c.stock ?? {}).map(([s, q]) => [conv(s), q])) }));
    await tx`
      update products set sizes = ${tx.json(sizes.map(conv))}, colors = ${tx.json(newColors as postgres.JSONValue)}, updated_at = now()
      where id = ${r.id}`;
    n++;
  }
  // Reviews show the size the customer bought: same conversion
  await tx`
    update reviews set product_size = case product_size
      when '52' then 'S' when '54' then 'M' when '56' then 'L' when '58' then 'XL' when '60' then 'XXL' end
    where product_size in ('52', '54', '56', '58', '60')`;
  console.info(`[db] sizes converted to letters on ${n} products`);
}

const NEW_CATEGORIES = [
  {
    slug: "abayas",
    name: "Abayas",
    nameAr: "العبايات",
    description: "Abayas amples et opaques : classiques, brodées, papillon et kimonos.",
    descriptionAr: "عبايات واسعة وغير شفّافة: كلاسيكية، مطرّزة، فراشة وكيمونو.",
    cut: "classique",
    color: "#1C2541",
  },
  {
    slug: "khimars",
    name: "Khimars",
    nameAr: "الخمارات",
    description: "Khimars longs et couvrants, de plusieurs styles, dans des tissus légers et opaques.",
    descriptionAr: "خمارات طويلة وساترة بأنواع مختلفة، من أقمشة خفيفة لا تشفّ.",
    cut: "khimar",
    color: "#6B5A4E",
  },
  {
    slug: "ensembles",
    name: "Ensembles",
    nameAr: "الأطقم",
    description: "Une abaya et son khimar assorti, réunis dans un ensemble à prix spécial.",
    descriptionAr: "عباية وخمار منسّقان، في طقم واحد بثمن خاص.",
    cut: "ensemble",
    color: "#2F3B33",
  },
];

/**
 * One-time regroup into exactly three categories: Abayas, Khimars, Sets (الأطقم) (November 2026). Runs only while
 * none of the three exists yet, so it never runs twice. Until then the shop only sold abayas, so the products of
 * every existing category (classique, brodée, papillon, kimono, egypt…) move to "abayas", each keeping its own
 * illustration style, and those emptied categories are removed. No product is deleted.
 */
async function regroupCategories(tx: postgres.TransactionSql<{}>) {
  const slugs = NEW_CATEGORIES.map((c) => c.slug);
  const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from categories where slug = any(${slugs})`;
  if (n > 0) return;

  const ids = new Map<string, number>();
  for (const [i, c] of NEW_CATEGORIES.entries()) {
    const [row] = await tx<{ id: number }[]>`
      insert into categories (slug, name, name_ar, description, description_ar, cut, color, position)
      values (${c.slug}, ${c.name}, ${c.nameAr}, ${c.description}, ${c.descriptionAr}, ${c.cut}, ${c.color}, ${i})
      returning id`;
    ids.set(c.slug, row.id);
  }
  await tx`
    update products set category_id = ${ids.get("abayas")!}, updated_at = now()
    where category_id is not null and category_id in (select id from categories where not slug = any(${slugs}))`;
  await tx`delete from categories where not slug = any(${slugs})`;
  console.info("[db] categories regrouped into Abayas / Khimars / Ensembles");
}
