import type { Locale } from "@/i18n/config";

/** sessionStorage key: the last order, shown on the thank-you page */
export const LAST_ORDER_KEY = "afnar-last-order";

export interface OrderLine {
  /** Product slug, used to show localised names */
  slug?: string;
  /** French product name */
  name: string;
  /** French colour name (the colour's id) */
  color: string;
  size: string;
  qty: number;
  unitPrice: number;
  /**
   * Set only: the pieces whose stock this line takes (abaya in the chosen size + khimar), recorded when the
   * order is placed so cancelling / returning gives back exactly those pieces even if the set changes later.
   */
  parts?: { slug: string; color: string; size: string; qty: number }[];
}

/** What the checkout sends to POST /api/order. Prices are NOT sent: the server recomputes them from the catalogue. */
export interface OrderRequest {
  locale: Locale;
  items: { slug: string; color: string; size: string; qty: number }[];
  customer: { fullName: string; phone: string; city: string; address: string; note?: string };
  /** Honeypot field, always empty for real customers (bots fill it in) */
  website?: string;
}

export type OrderResponse =
  | { ok: true; order: OrderPayload }
  | { ok: false; error: "invalid" | "stock" | "rate_limit" | "send_failed"; fields?: string[] };

export interface OrderPayload {
  ref: string;
  locale: Locale;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: {
    fullName: string;
    /** Normalised Moroccan mobile: 06XXXXXXXX / 07XXXXXXXX */
    phone: string;
    city: string;
    address: string;
    note?: string;
  };
}
