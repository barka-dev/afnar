import type { Metadata } from "next";
import Link from "next/link";
import { listOrders, orderCounts } from "@/lib/server/orders";
import { ORDER_STATUSES, STATUS_LABEL, isOrderStatus } from "@/lib/order-status";
import { PageHeader, StatusBadge, inputCls } from "../../_ui/ui";
import { dateTime, dh, phone } from "../../_ui/format";

export const metadata: Metadata = { title: "Commandes" };
export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = isOrderStatus(sp.statut) ? sp.statut : undefined;
  const q = (sp.q ?? "").slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ orders, total, pages }, counts] = await Promise.all([listOrders({ status, q, page }), orderCounts()]);

  const url = (p: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    const merged = { statut: status, q: q || undefined, ...p };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && !(k === "page" && Number(v) === 1)) u.set(k, String(v));
    const s = u.toString();
    return `/admin/commandes${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Commandes" subtitle={`${counts.all} commande${counts.all > 1 ? "s" : ""} au total`} />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ key: undefined, label: "Toutes", n: counts.all }, ...ORDER_STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s], n: counts[s] }))].map((t) => (
          <Link
            key={t.label}
            href={url({ statut: t.key, page: 1 })}
            aria-current={status === t.key ? "page" : undefined}
            className="flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-stone bg-white px-3.5 text-sm text-muted transition-colors hover:border-ink hover:text-ink aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-ivory"
          >
            {t.label}
            <span className="text-xs tabular-nums opacity-70">{t.n}</span>
          </Link>
        ))}
      </div>

      <form className="mt-4 flex gap-2" action="/admin/commandes">
        {status && <input type="hidden" name="statut" value={status} />}
        <input name="q" defaultValue={q} placeholder="Rechercher : réf., nom, téléphone, ville…" className={inputCls} type="search" />
        <button className="shrink-0 rounded-md bg-ink px-4 text-sm text-ivory hover:bg-gold-dark">Rechercher</button>
      </form>

      {orders.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-stone bg-white/60 py-16 text-center text-sm text-muted">
          {q || status ? "Aucune commande ne correspond." : "Aucune commande pour le moment. Elles apparaîtront ici dès qu'une cliente commande."}
        </p>
      ) : (
        <>
          {/* Phones: cards */}
          <ul className="mt-4 space-y-2 md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/commandes/${o.id}`} className="block rounded-lg border border-stone/70 bg-white p-4 active:bg-sand/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate">{o.customer.fullName}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {o.customer.city} · {phone(o.customer.phone)}
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="mt-3 flex items-end justify-between text-xs text-muted">
                    <span>
                      {o.ref} · {dateTime(o.createdAt)}
                      <br />
                      {o.lines.reduce((n, l) => n + l.qty, 0)} article(s)
                    </span>
                    <span className="text-base tabular-nums text-ink">{dh(o.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Tablet / desktop: table */}
          <div className="mt-4 hidden overflow-hidden rounded-lg border border-stone/70 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-stone/70 bg-sand/40 text-start text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-normal">Commande</th>
                  <th className="px-4 py-3 text-start font-normal">Cliente</th>
                  <th className="px-4 py-3 text-start font-normal">Ville</th>
                  <th className="px-4 py-3 text-end font-normal">Articles</th>
                  <th className="px-4 py-3 text-end font-normal">Total</th>
                  <th className="px-4 py-3 text-start font-normal">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/60">
                {orders.map((o) => (
                  <tr key={o.id} className="group relative hover:bg-sand/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/commandes/${o.id}`} className="after:absolute after:inset-0">
                        {o.ref}
                      </Link>
                      <p className="text-xs text-muted">{dateTime(o.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {o.customer.fullName}
                      <p className="text-xs text-muted">{phone(o.customer.phone)}</p>
                    </td>
                    <td className="px-4 py-3">{o.customer.city}</td>
                    <td className="px-4 py-3 text-end tabular-nums">{o.lines.reduce((n, l) => n + l.qty, 0)}</td>
                    <td className="px-4 py-3 text-end tabular-nums">{dh(o.total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Pages">
              {page > 1 ? (
                <Link href={url({ page: page - 1 })} className="rounded-md border border-stone bg-white px-4 py-2 hover:border-ink">
                  ← Précédentes
                </Link>
              ) : (
                <span />
              )}
              <span className="text-muted">
                Page {page} / {pages} · {total} résultats
              </span>
              {page < pages ? (
                <Link href={url({ page: page + 1 })} className="rounded-md border border-stone bg-white px-4 py-2 hover:border-ink">
                  Suivantes →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}
