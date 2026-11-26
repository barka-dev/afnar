/**
 * Sends new orders to the store's Telegram (server-only: uses the secret bot token).
 *
 * Env:
 *  - TELEGRAM_BOT_TOKEN — from @BotFather
 *  - TELEGRAM_CHAT_ID   — who receives the orders (your chat with the bot, or a group). Several ids: comma-separated.
 *  - unset              — in development the message is only printed in the terminal; in production orders are refused.
 *
 * The message (French, for the store team) shows the customer's phone as a wa.me link, with a
 * "Confirmer sur WhatsApp" button underneath. Both open a WhatsApp chat with the customer, pre-filled
 * with a confirmation message in Arabic (the shop's only language).
 */

import { STORE } from "@/lib/config";
import { formatPrice } from "@/i18n";
import { formatDH } from "@/lib/format";
import { cityLabel } from "@/lib/cities";
import { colorLabel, productName, type Product } from "@/lib/products";
import type { OrderPayload } from "@/lib/order";

export type SendResult = { ok: true; via: string } | { ok: false; via: string; error: string };

const TIMEOUT_MS = 15_000;

// ——— Message ———

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const dh = formatDH;

/** 0612345678 -> "06 12 34 56 78" */
export const prettyPhone = (p: string) => p.replace(/(\d{2})(?=\d)/g, "$1 ");

/** 0612345678 -> "212612345678" (wa.me format) */
const intlPhone = (p: string) => `212${p.replace(/^0/, "")}`;

/** The confirmation the store sends the customer, in Arabic (pre-filled in WhatsApp). */
export function customerConfirmationText(o: OrderPayload, products: Product[]): string {
  const l = o.locale;
  const getProduct = (slug: string) => products.find((p) => p.slug === slug);
  const first = o.customer.fullName.split(" ")[0];
  const items = o.lines.map((line) => {
    const p = line.slug ? getProduct(line.slug) : undefined;
    const c = p?.colors.find((x) => x.name === line.color);
    const name = p ? productName(p, l) : line.name;
    const color = c ? colorLabel(c, l) : line.color;
    return `- ${name} (${color}، مقاس ${line.size}) × ${line.qty}`;
  });
  const city = cityLabel(o.customer.city, l);

  return [
    `السلام عليكم ${first}، معكِ ${STORE.name}.`,
    `جزاكِ الله خيرًا على طلبكِ ${o.ref}:`,
    ...items,
    `المبلغ عند الاستلام: ${formatPrice(o.total, l)}`,
    `التوصيل: ${city}، ${o.customer.address}`,
    ``,
    `واش تأكدي لينا الطلب باش نصيفطوه ليكِ إن شاء الله؟ بارك الله فيكِ.`,
  ].join("\n");
}

/** wa.me link to the customer, pre-filled with the confirmation message */
export function customerWhatsAppLink(o: OrderPayload, products: Product[]): string {
  return `https://wa.me/${intlPhone(o.customer.phone)}?text=${encodeURIComponent(customerConfirmationText(o, products))}`;
}

/** Public address of the site, for the "manage in the dashboard" link (SITE_URL, or Vercel's production domain). */
export function siteUrl(): string | undefined {
  const explicit = process.env.SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : undefined;
}

/** Telegram message (HTML parse mode), in French for the store team. */
export function buildOrderMessage(o: OrderPayload, products: Product[], orderId?: number): string {
  const wa = customerWhatsAppLink(o, products);
  const site = siteUrl();
  const items = o.lines
    .map(
      (l, i) =>
        `${i + 1}. <b>${esc(l.name)}</b> — ${esc(l.color)}, T${esc(l.size)}\n` +
        `    ${l.qty} × ${dh(l.unitPrice)} = ${dh(l.qty * l.unitPrice)}`
    )
    .join("\n");

  return [
    `🛍 <b>Nouvelle commande ${esc(STORE.name)}</b>`,
    `Réf : <code>${esc(o.ref)}</code>`,
    ``,
    `👤 <b>${esc(o.customer.fullName)}</b>`,
    `📱 <a href="${esc(wa)}">${esc(prettyPhone(o.customer.phone))}</a>  ← WhatsApp`,
    `📍 ${esc(o.customer.city)} — ${esc(o.customer.address)}`,
    o.customer.note ? `📝 ${esc(o.customer.note)}` : null,
    ``,
    `<b>Articles</b>`,
    items,
    ``,
    `Sous-total : ${dh(o.subtotal)}`,
    `Livraison : ${o.shipping === 0 ? "Offerte" : dh(o.shipping)}`,
    `💰 <b>À encaisser à la livraison : ${dh(o.total)}</b>`,
    ``,
    orderId && site ? `🗂 <a href="${esc(`${site}/admin/commandes/${orderId}`)}">Gérer dans le tableau de bord</a>` : null,
  ]
    .filter((x) => x !== null)
    .join("\n");
}

// ——— Sending ———

export async function sendOrderToTelegram(o: OrderPayload, products: Product[], orderId?: number): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatIds = (process.env.TELEGRAM_CHAT_ID || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const text = buildOrderMessage(o, products, orderId);
  const button = { text: "✅ Confirmer sur WhatsApp", url: customerWhatsAppLink(o, products) };

  if (!token || chatIds.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[order] Telegram not configured — message (not sent):\n${text}\n[button] ${button.url}\n`);
      return { ok: true, via: "log" };
    }
    return { ok: false, via: "telegram", error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set" };
  }

  const api = (process.env.TELEGRAM_API_URL || "https://api.telegram.org").replace(/\/$/, "");
  const errors: string[] = [];
  let delivered = 0;

  const send = async (chat_id: string, withButton: boolean) => {
    const res = await fetch(`${api}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id,
        text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...(withButton ? { reply_markup: { inline_keyboard: [[button]] } } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    return { ok: res.ok && !!body?.ok, status: res.status, description: body?.description ?? "" };
  };

  for (const chat_id of chatIds) {
    try {
      let r = await send(chat_id, true);
      // If Telegram refuses the request (e.g. the button's long URL), retry without the button:
      // the phone number in the text is still a WhatsApp link.
      if (!r.ok && r.status === 400) {
        console.warn(`[order] ${o.ref} Telegram refused the message with button (${r.description}), retrying without it`);
        r = await send(chat_id, false);
      }
      if (r.ok) delivered++;
      else errors.push(`chat ${chat_id}: HTTP ${r.status} ${r.description}`.trim());
    } catch (err) {
      errors.push(`chat ${chat_id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Delivered to at least one recipient = the store has the order.
  if (delivered > 0 && errors.length) console.warn(`[order] ${o.ref} not delivered to every Telegram chat: ${errors.join("; ")}`);
  if (delivered > 0) return { ok: true, via: `telegram (${delivered}/${chatIds.length})` };
  return { ok: false, via: "telegram", error: errors.join("; ") };
}
