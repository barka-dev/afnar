import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { MOROCCAN_CITIES } from "@/lib/cities";
import { shippingFee } from "@/lib/config";
import { generateOrderRef, normalizeMoroccanPhone } from "@/lib/format";
import { revalidateTag } from "next/cache";
import { SIZES, stockFor, type Product, type Size } from "@/lib/products";
import type { OrderLine, OrderPayload, OrderRequest, OrderResponse } from "@/lib/order";
import { buildOrderMessage, sendOrderToTelegram } from "@/lib/server/telegram";
import { TAGS, readProducts } from "@/lib/server/catalog";
import { createOrder, markNotified } from "@/lib/server/orders";

/**
 * Receives an order from the checkout, re-checks it against the catalogue (prices, stock, city, phone),
 * saves it in the database (reserving the stock) and notifies the store's Telegram in the background.
 * The customer never leaves the site.
 *
 * Success = the order is saved in the dashboard OR delivered to Telegram, so nothing is lost if one of them is down.
 */

const MAX_ITEMS = 20;
const MAX_QTY = 10;

// Simple per-IP limit against spam: 5 orders per 10 minutes.
// (In-memory: resets on restart and is per server instance — enough for a small shop.)
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
  return recent.length > MAX_PER_WINDOW;
}

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

const reply = (body: OrderResponse, status = 200) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  let input: Partial<OrderRequest>;
  try {
    input = await request.json();
  } catch {
    return reply({ ok: false, error: "invalid" }, 400);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
  if (rateLimited(ip)) return reply({ ok: false, error: "rate_limit" }, 429);

  // ——— Customer ———
  const fullName = clean(input.customer?.fullName, 100);
  const phone = normalizeMoroccanPhone(clean(input.customer?.phone, 30));
  const city = clean(input.customer?.city, 60);
  const address = clean(input.customer?.address, 300);
  const note = clean(input.customer?.note, 500);
  const bad: string[] = [];
  if (fullName.length < 3) bad.push("fullName");
  if (!phone) bad.push("phone");
  if (!MOROCCAN_CITIES.includes(city)) bad.push("city");
  if (address.length < 8) bad.push("address");
  if (bad.length) return reply({ ok: false, error: "invalid", fields: bad }, 400);

  const locale = hasLocale(input.locale) ? input.locale : DEFAULT_LOCALE;

  // ——— Items: resolved against the catalogue, never trusting client prices ———
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > MAX_ITEMS) {
    return reply({ ok: false, error: "invalid" }, 400);
  }
  let products: Product[];
  try {
    products = await readProducts({ activeOnly: true });
  } catch (err) {
    console.error("[order] catalogue unavailable:", err);
    return reply({ ok: false, error: "send_failed" }, 503);
  }
  const lines: OrderLine[] = [];
  for (const it of input.items) {
    const product = products.find((p) => p.slug === String(it?.slug));
    const color = product?.colors.find((c) => c.name === it?.color);
    const size = String(it?.size) as Size;
    const qty = Math.floor(Number(it?.qty));
    if (!product || !color || !SIZES.includes(size) || !product.sizes.includes(size) || !(qty >= 1 && qty <= MAX_QTY)) {
      return reply({ ok: false, error: "invalid" }, 400);
    }
    if (qty > stockFor(color, size)) return reply({ ok: false, error: "stock" }, 409);
    lines.push({ slug: product.slug, name: product.name, color: color.name, size, qty, unitPrice: product.price });
  }

  const subtotal = lines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
  const shipping = shippingFee(city, subtotal);
  const order: OrderPayload = {
    ref: generateOrderRef(),
    locale,
    lines,
    subtotal,
    shipping,
    total: subtotal + shipping,
    customer: { fullName, phone: phone!, city, address, note: note || undefined },
  };
  // Honeypot filled → pretend success so bots learn nothing, but send nothing.
  if (clean(input.website, 100)) return reply({ ok: true, order });

  // 1. Save in the dashboard (and reserve the stock)
  let orderId: number | undefined;
  try {
    const saved = await createOrder(order);
    if (!saved.ok) return reply({ ok: false, error: "stock" }, 409);
    orderId = saved.id;
    revalidateTag(TAGS.catalog, { expire: 0 }); // stock changed
  } catch (err) {
    console.error(`[order] ${order.ref} could not be saved in the database:`, err);
  }

  // 2. Notify on Telegram
  const result = await sendOrderToTelegram(order, products, orderId);
  if (result.ok && orderId) await markNotified(orderId).catch(() => {});

  if (!result.ok && !orderId) {
    // Neither saved nor delivered: keep a trace in the logs and let the customer retry.
    console.error(`[order] ${order.ref} NOT saved and NOT delivered via ${result.via}: ${result.error}\n${buildOrderMessage(order, products)}`);
    return reply({ ok: false, error: "send_failed" }, 502);
  }
  if (!result.ok) console.error(`[order] ${order.ref} saved (#${orderId}) but Telegram failed: ${result.error}`);
  else console.info(`[order] ${order.ref} ${orderId ? `saved #${orderId}` : "NOT saved"}, sent via ${result.via} (${order.total} DH)`);
  return reply({ ok: true, order });
}
