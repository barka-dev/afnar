import "server-only";
import postgres from "postgres";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "./seed-data";

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

const g = globalThis as unknown as { __afnarSql?: Sql; __afnarSchema?: Promise<void> };

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
  g.__afnarSchema ??= migrate(sql).catch((err) => {
    g.__afnarSchema = undefined; // retry on next call
    throw err;
  });
  await g.__afnarSchema;
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
  });
}
