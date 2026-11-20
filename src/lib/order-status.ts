/** Order lifecycle, as managed in the admin dashboard. */
export const ORDER_STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled", "returned"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  returned: "Retournée",
};

/** Tailwind classes for the status badge */
export const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-gold/15 text-gold-dark ring-gold/40",
  confirmed: "bg-sky-50 text-sky-800 ring-sky-200",
  shipped: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-stone/40 text-muted ring-stone",
  returned: "bg-rose-50 text-rose-800 ring-rose-200",
};

/** Cancelled and returned orders give their pieces back to the stock. */
export const RELEASES_STOCK: ReadonlySet<OrderStatus> = new Set(["cancelled", "returned"]);

export const isOrderStatus = (v: unknown): v is OrderStatus => ORDER_STATUSES.includes(v as OrderStatus);
