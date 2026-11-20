import "server-only";
import type postgres from "postgres";
import { db } from "./db";
import { RELEASES_STOCK, isOrderStatus, type OrderStatus } from "@/lib/order-status";
import type { OrderLine, OrderPayload } from "@/lib/order";
import type { ProductColor } from "@/lib/products";

export interface OrderRecord extends OrderPayload {
  id: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notified: boolean;
  stockReserved: boolean;
  adminNote: string;
  history: { status: OrderStatus; at: string }[];
}

type Tx = postgres.TransactionSql<{}>;
type Row = Record<string, unknown>;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));

function toOrder(r: Row): OrderRecord {
  return {
    id: Number(r.id),
    ref: String(r.ref),
    status: isOrderStatus(r.status) ? r.status : "new",
    locale: r.locale === "ar" ? "ar" : "fr",
    lines: r.lines as OrderLine[],
    subtotal: Number(r.subtotal),
    shipping: Number(r.shipping),
    total: Number(r.total),
    customer: {
      fullName: String(r.full_name),
      phone: String(r.phone),
      city: String(r.city),
      address: String(r.address),
      note: r.note ? String(r.note) : undefined,
    },
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    notified: !!r.notified,
    stockReserved: !!r.stock_reserved,
    adminNote: String(r.admin_note ?? ""),
    history: (r.history as OrderRecord["history"]) ?? [],
  };
}

/**
 * Adds (sign = +1) or removes (sign = -1) the order's pieces from the stock.
 * Returns false (and changes nothing) if removing would make a stock negative.
 */
async function moveStock(tx: Tx, lines: OrderLine[], sign: 1 | -1, allowShortage = false): Promise<boolean> {
  const slugs = [...new Set(lines.map((l) => l.slug).filter(Boolean))] as string[];
  if (!slugs.length) return true;
  const rows = await tx<{ id: number; slug: string; colors: ProductColor[] }[]>`
    select id, slug, colors from products where slug = any(${slugs}) for update`;
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  for (const l of lines) {
    const p = l.slug ? bySlug.get(l.slug) : undefined;
    const c = p?.colors.find((x) => x.name === l.color);
    if (!p || !c) {
      if (sign === -1 && !allowShortage) return false; // product removed meanwhile
      continue;
    }
    const size = l.size as keyof ProductColor["stock"];
    const next = (c.stock[size] ?? 0) + sign * l.qty;
    if (next < 0 && !allowShortage) return false;
    c.stock[size] = Math.max(0, next);
  }
  for (const r of rows) {
    await tx`update products set colors = ${tx.json(r.colors as unknown as postgres.JSONValue)}, updated_at = now() where id = ${r.id}`;
  }
  return true;
}

/** Saves a new order and reserves its pieces. "stock" = a piece ran out in the meantime. */
export async function createOrder(o: OrderPayload): Promise<{ ok: true; id: number } | { ok: false; error: "stock" }> {
  const sql = await db();
  return sql.begin(async (tx) => {
    if (!(await moveStock(tx, o.lines, -1))) return { ok: false as const, error: "stock" as const };
    const [row] = await tx<{ id: number }[]>`
      insert into orders (ref, locale, full_name, phone, city, address, note, lines, subtotal, shipping, total, history)
      values (${o.ref}, ${o.locale}, ${o.customer.fullName}, ${o.customer.phone}, ${o.customer.city}, ${o.customer.address},
              ${o.customer.note ?? null}, ${tx.json(o.lines as unknown as postgres.JSONValue)}, ${o.subtotal}, ${o.shipping}, ${o.total},
              ${tx.json([{ status: "new", at: new Date().toISOString() }])})
      returning id`;
    return { ok: true as const, id: row.id };
  });
}

export async function markNotified(id: number) {
  const sql = await db();
  await sql`update orders set notified = true where id = ${id}`;
}

/** Changes the status; cancelling / returning puts the pieces back in stock (and un-cancelling takes them again). */
export async function setOrderStatus(id: number, status: OrderStatus): Promise<{ ok: true } | { ok: false; error: string }> {
  const sql = await db();
  return sql.begin(async (tx) => {
    const [row] = await tx`select * from orders where id = ${id} for update`;
    if (!row) return { ok: false as const, error: "Commande introuvable." };
    const order = toOrder(row);
    if (order.status === status) return { ok: true as const };

    let reserved = order.stockReserved;
    if (RELEASES_STOCK.has(status) && reserved) {
      await moveStock(tx, order.lines, 1);
      reserved = false;
    } else if (!RELEASES_STOCK.has(status) && !reserved) {
      // Re-activated order: take the pieces again (even if it leaves a size at 0 — the order already exists)
      await moveStock(tx, order.lines, -1, true);
      reserved = true;
    }
    const history = [...order.history, { status, at: new Date().toISOString() }];
    await tx`
      update orders set status = ${status}, stock_reserved = ${reserved}, history = ${tx.json(history)}, updated_at = now()
      where id = ${id}`;
    return { ok: true as const };
  });
}

export async function updateOrderNote(id: number, note: string) {
  const sql = await db();
  await sql`update orders set admin_note = ${note.slice(0, 2000)}, updated_at = now() where id = ${id}`;
}

export async function deleteOrder(id: number) {
  const sql = await db();
  await sql.begin(async (tx) => {
    const [row] = await tx`select * from orders where id = ${id} for update`;
    if (!row) return;
    const order = toOrder(row);
    if (order.stockReserved) await moveStock(tx, order.lines, 1);
    await tx`delete from orders where id = ${id}`;
  });
}

export async function getOrder(id: number): Promise<OrderRecord | undefined> {
  const sql = await db();
  const [row] = await sql`select * from orders where id = ${id}`;
  return row ? toOrder(row) : undefined;
}

export const ORDERS_PER_PAGE = 25;

export async function listOrders(opts: { status?: OrderStatus; q?: string; page?: number }) {
  const sql = await db();
  const page = Math.max(1, opts.page ?? 1);
  const q = opts.q?.trim();
  const like = q ? `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%` : null;
  const digits = q?.replace(/\D/g, "");
  const where = sql`
    ${opts.status ? sql`status = ${opts.status}` : sql`true`}
    and ${
      like
        ? sql`(ref ilike ${like} or full_name ilike ${like} or city ilike ${like} ${digits && digits.length >= 3 ? sql`or phone like ${`%${digits}%`}` : sql``})`
        : sql`true`
    }`;
  const [rows, [{ n }]] = await Promise.all([
    sql`select * from orders where ${where} order by created_at desc limit ${ORDERS_PER_PAGE} offset ${(page - 1) * ORDERS_PER_PAGE}`,
    sql<{ n: number }[]>`select count(*)::int as n from orders where ${where}`,
  ]);
  return { orders: rows.map(toOrder), total: n, page, pages: Math.max(1, Math.ceil(n / ORDERS_PER_PAGE)) };
}

export async function orderCounts(): Promise<Record<OrderStatus | "all", number>> {
  const sql = await db();
  const rows = await sql<{ status: OrderStatus; n: number }[]>`select status, count(*)::int as n from orders group by status`;
  const out = { all: 0, new: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0, returned: 0 };
  for (const r of rows) {
    if (r.status in out) out[r.status] = r.n;
    out.all += r.n;
  }
  return out;
}

export type Bucket = "day" | "week" | "month";
export interface DeliveryPoint {
  /** Start of the bucket, YYYY-MM-DD (Morocco time) */
  key: string;
  orders: number;
  revenue: number;
}

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const bucketStart = (iso: string, bucket: Bucket) => {
  if (bucket === "month") return `${iso.slice(0, 7)}-01`;
  if (bucket === "week") return addDays(iso, -((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7)); // Monday
  return iso;
};
const nextBucket = (iso: string, bucket: Bucket) => {
  if (bucket === "day") return addDays(iso, 1);
  if (bucket === "week") return addDays(iso, 7);
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Delivered orders and their revenue between two dates (inclusive, Morocco time), grouped by day / week / month.
 * An order counts on the day it was marked "Livrée". Also returns the totals of the previous period of the same length.
 */
export async function deliveryStats(from: string, to: string, bucket: Bucket) {
  const sql = await db();
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
  const prevFrom = addDays(from, -days);
  const delivered = sql`
    select total, (
      select max((h->>'at')::timestamptz) from jsonb_array_elements(history) h where h->>'status' = 'delivered'
    ) at time zone 'Africa/Casablanca' as local_at
    from orders where status = 'delivered'`;

  const [rows, [prev]] = await Promise.all([
    sql<{ k: string; n: number; revenue: number }[]>`
      with d as (${delivered})
      select to_char(date_trunc(${bucket}, local_at), 'YYYY-MM-DD') as k, count(*)::int as n, coalesce(sum(total), 0)::int as revenue
      from d where local_at >= ${from}::date and local_at < ${to}::date + 1
      group by 1`,
    sql<{ n: number; revenue: number }[]>`
      with d as (${delivered})
      select count(*)::int as n, coalesce(sum(total), 0)::int as revenue
      from d where local_at >= ${prevFrom}::date and local_at < ${from}::date`,
  ]);

  const byKey = new Map(rows.map((r) => [r.k, r]));
  const points: DeliveryPoint[] = [];
  for (let k = bucketStart(from, bucket); k <= to; k = nextBucket(k, bucket)) {
    const r = byKey.get(k);
    points.push({ key: k, orders: r?.n ?? 0, revenue: r?.revenue ?? 0 });
  }
  return {
    points,
    orders: points.reduce((n, p) => n + p.orders, 0),
    revenue: points.reduce((n, p) => n + p.revenue, 0),
    previous: { orders: prev.n, revenue: prev.revenue },
  };
}

/** Today's date in Morocco, YYYY-MM-DD */
export const todayInMorocco = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Casablanca" }).format(new Date());
export { addDays as shiftDate };

/** Dashboard figures (Morocco time). */
export async function dashboardStats() {
  const sql = await db();
  const [s] = await sql<
    { today: number; today_total: number; month: number; month_total: number; delivered_month: number; to_handle: number }[]
  >`
    with o as (select *, (created_at at time zone 'Africa/Casablanca') as local_at from orders),
    now_local as (select (now() at time zone 'Africa/Casablanca') as t)
    select
      count(*) filter (where local_at::date = (select t::date from now_local))::int as today,
      coalesce(sum(total) filter (where local_at::date = (select t::date from now_local) and status not in ('cancelled','returned')), 0)::int as today_total,
      count(*) filter (where date_trunc('month', local_at) = date_trunc('month', (select t from now_local)))::int as month,
      coalesce(sum(total) filter (where date_trunc('month', local_at) = date_trunc('month', (select t from now_local)) and status not in ('cancelled','returned')), 0)::int as month_total,
      coalesce(sum(total) filter (where date_trunc('month', local_at) = date_trunc('month', (select t from now_local)) and status = 'delivered'), 0)::int as delivered_month,
      count(*) filter (where status in ('new','confirmed'))::int as to_handle
    from o`;
  const recent = (await sql`select * from orders order by created_at desc limit 8`).map(toOrder);
  return { ...s, recent };
}
