import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/server/orders";
import { readProducts } from "@/lib/server/catalog";
import { customerWhatsAppLink } from "@/lib/server/telegram";
import { STATUS_LABEL } from "@/lib/order-status";
import { Card, PageHeader, StatusBadge } from "../../../_ui/ui";
import { dateTime, dh, phone } from "../../../_ui/format";
import OrderActions from "./OrderActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: `Commande #${(await params).id}` };
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [order, products] = await Promise.all([getOrder(id), readProducts()]);
  if (!order) notFound();
  const c = order.customer;
  const wa = customerWhatsAppLink(order, products);

  return (
    <>
      <Link href="/admin/commandes" className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← Commandes
      </Link>
      <PageHeader
        title={`Commande ${order.ref}`}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} /> Reçue le {dateTime(order.createdAt)}
            {!order.notified && <span className="text-xs text-sold">· notification Telegram non reçue</span>}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="Cliente">
            <p className="text-lg">{c.fullName}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#1f8f4e] px-4 text-sm text-white hover:bg-[#17733e]">
                ✅ Confirmer sur WhatsApp
              </a>
              <a href={`tel:${c.phone}`} className="inline-flex min-h-10 items-center rounded-md border border-stone bg-white px-4 text-sm hover:border-ink">
                📞 {phone(c.phone)}
              </a>
            </div>
            <p className="mt-2 text-xs text-muted">
              Le message WhatsApp est pré-rempli en arabe, la langue de la boutique.
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Ville</dt>
                <dd>{c.city}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Adresse</dt>
                <dd dir="auto">{c.address}</dd>
              </div>
              {c.note && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Note de la cliente</dt>
                  <dd dir="auto" className="whitespace-pre-line">
                    {c.note}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Articles">
            <ul className="divide-y divide-stone/60">
              {order.lines.map((l, i) => {
                const p = products.find((x) => x.slug === l.slug);
                return (
                  <li key={i} className="flex items-start justify-between gap-4 py-3 text-sm">
                    <div>
                      {p ? (
                        <Link href={`/admin/produits/${p.id}`} className="hover:underline">
                          {l.name}
                        </Link>
                      ) : (
                        l.name
                      )}
                      <p className="text-xs text-muted">
                        {l.color} · T{l.size} · {l.qty} × {dh(l.unitPrice)}
                      </p>
                    </div>
                    <span className="tabular-nums">{dh(l.qty * l.unitPrice)}</span>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-stone/60 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Sous-total</dt>
                <dd className="tabular-nums">{dh(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Livraison</dt>
                <dd className="tabular-nums">{order.shipping === 0 ? "Offerte" : dh(order.shipping)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base">
                <dt>À encaisser</dt>
                <dd className="tabular-nums">{dh(order.total)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <OrderActions id={order.id} status={order.status} note={order.adminNote} stockReserved={order.stockReserved} />

          <Card title="Historique">
            <ol className="space-y-2 text-sm">
              {[...order.history].reverse().map((h, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{STATUS_LABEL[h.status]}</span>
                  <span className="text-muted">{dateTime(h.at)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
