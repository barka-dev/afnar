import type { Metadata } from "next";
import Link from "next/link";
import { dashboardStats } from "@/lib/server/orders";
import { readProducts } from "@/lib/server/catalog";
import { colorLabel } from "@/lib/products";
import { Card, PageHeader, StatusBadge } from "../_ui/ui";
import { dateTime, dh } from "../_ui/format";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

const LOW = 2;

export default async function Dashboard() {
  const [s, products] = await Promise.all([dashboardStats(), readProducts()]);
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
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
                      {p.name} <span className="text-muted">· {colorLabel(c, "fr")} · T{size}</span>
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
