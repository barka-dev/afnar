import { formatDH } from "@/lib/format";

export const dh = formatDH;

const DT = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Casablanca", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const D = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Casablanca", day: "numeric", month: "long", year: "numeric" });

/** "19 nov., 20:15" (Morocco time) */
export const dateTime = (iso: string) => DT.format(new Date(iso));
export const longDate = (iso: string) => D.format(new Date(iso));

/** 0612345678 -> "06 12 34 56 78" */
export const phone = (p: string) => p.replace(/(\d{2})(?=\d)/g, "$1 ");
export const waLink = (p: string) => `https://wa.me/212${p.replace(/^0/, "")}`;
