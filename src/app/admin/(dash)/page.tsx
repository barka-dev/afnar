import type { Metadata } from "next";
import Link from "next/link";
import { dashboardStats, deliveryStats, shiftDate, todayInMorocco, type Bucket } from "@/lib/server/orders";
import DeliveryChart from "./DeliveryChart";
import { readProducts } from "@/lib/server/catalog";
import { Card, PageHeader, StatusBadge } from "../_ui/ui";
import { dateTime, dh } from "../_ui/format";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

const LOW = 2;

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** Turns ?periode=…&du=…&au=… into a date range and a bar size (day / week / month). */
function period(sp: Record<string, string | undefined>) {
  const today = todayInMorocco();
  const p = sp.periode ?? "30j";
  let from = shiftDate(today, -29);
  let to = today;
  if (p === "7j") from = shiftDate(today, -6);
  else if (p === "90j") from = shiftDate(today, -89);
  else if (p === "mois") from = `${today.slice(0, 7)}-01`;
  else if (p === "12m") {
    const d = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - 11);
    from = d.toISOString().slice(0, 10);
  } else if (p === "perso" && isDate(sp.du) && isDate(sp.au)) {
    [from, to] = sp.du <= sp.au ? [sp.du, sp.au] : [sp.au, sp.du];
    if (Date.parse(to) - Date.parse(from) > 5 * 366 * 86_400_000) from = shiftDate(to, -5 * 366); // keep it reasonable
  }
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
  const bucket: Bucket = days <= 35 ? "day" : days <= 190 ? "week" : "month";
  const preset = ["7j", "30j", "90j", "mois", "12m"].includes(p) || (p === "perso" && isDate(sp.du)) ? p : "30j";
  return { from, to, bucket, preset };
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const range = period(await searchParams);
  const [s, products, delivery] = await Promise.all([dashboardStats(), readProducts(), deliveryStats(range.from, range.to, range.bucket)]);
  const low = products
    .filter((p) => p.active)
    .flatMap((p) => p.colors.flatMap((c) => p.sizes.filter((size) => (c.stock[size] ?? 0) <= LOW).map((size) => ({ p, c, size, n: c.stock[size] ?? 0 }))))
    .sort((a, b) => a.n - b.n);

  const stats = [
    { label: "Commandes aujourd'hui", value: String(s.today), sub: dh(s.today_total) },
    { label: "À traiter", value: String(s.to_handle), sub: "nouvelles + confirmées", href: "/admin/commandes?statut=new" },
    { label: "Commandes ce mois", value: String(s.month), sub: dh(s.month_total) },
    { label: "Livré ce mois", value: dh(s.delivered_month), sub: "encaissé à la livraison" },
  ];

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de la boutique (heure du Maroc)." />

      <DeliveryChart
        points={delivery.points}
        bucket={range.bucket}
        totals={{ orders: delivery.orders, revenue: delivery.revenue }}
        previous={delivery.previous}
        preset={range.preset}
        from={range.from}
        to={range.to}
      />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((x) => {
          const body = (
            <>
              <p className="text-xs text-muted">{x.label}</p>
              <p className="mt-2 font-serif text-3xl leading-none sm:text-4xl">{x.value}</p>
              <p className="mt-2 text-xs text-muted">{x.sub}</p>
            </>
          );
          return x.href ? (
            <Link key={x.label} href={x.href} className="rounded-lg border border-stone/70 bg-white p-4 transition-colors hover:border-ink sm:p-5">
              {body}
            </Link>
          ) : (
            <div key={x.label} className="rounded-lg border border-stone/70 bg-white p-4 sm:p-5">
              {body}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card
          title="Dernières commandes"
          aside={
            <Link href="/admin/commandes" className="text-xs text-muted hover:text-ink">
              Tout voir →
            </Link>
          }
        >
          {s.recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Aucune commande pour le moment.</p>
          ) : (
            <ul className="-mx-2 divide-y divide-stone/60">
              {s.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/commandes/${o.id}`} className="flex items-center gap-3 rounded-md px-2 py-3 hover:bg-sand/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {o.customer.fullName} <span className="text-muted">· {o.customer.city}</span>
                      </p>
                      <p className="text-xs text-muted">
                        {o.ref} · {dateTime(o.createdAt)}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm tabular-nums">{dh(o.total)}</p>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Stock faible (≤ ${LOW})`}>
          {low.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Tout est bien en stock.</p>
          ) : (
            <ul className="-mx-2 max-h-[26rem] divide-y divide-stone/60 overflow-y-auto">
              {low.map(({ p, c, size, n }) => (
                <li key={`${p.id}-${c.name}-${size}`}>
                  <Link href={`/admin/produits/${p.id}`} className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-sand/60">
                    <span className="h-4 w-4 shrink-0 rounded-full border border-stone" style={{ background: c.hex }} />
                    <span className="min-w-0 flex-1 truncate">
                      {p.name} <span className="text-muted">· {c.name} · T{size}</span>
                    </span>
                    <span className={`tabular-nums ${n === 0 ? "text-sold" : "text-gold-dark"}`}>{n === 0 ? "Épuisé" : n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
