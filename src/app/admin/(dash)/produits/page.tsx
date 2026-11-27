import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { readCategories, readProducts } from "@/lib/server/catalog";
import { totalStock } from "@/lib/products";
import AbayaArt from "@/components/AbayaArt";
import { PageHeader } from "../../_ui/ui";
import { dh } from "../../_ui/format";
import ActiveToggle from "./ActiveToggle";

export const metadata: Metadata = { title: "Produits" };
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([readProducts(), readCategories()]);
  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "Sans catégorie";

  return (
    <>
      <PageHeader
        title="Produits"
        subtitle={`${products.length} produit${products.length > 1 ? "s" : ""} · ${products.filter((p) => p.active).length} en ligne`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/produits/ensemble" className="inline-flex min-h-10 items-center rounded-md border border-stone bg-white px-4 text-sm hover:border-ink">
              + Nouvel ensemble
            </Link>
            <Link href="/admin/produits/nouveau" className="inline-flex min-h-10 items-center rounded-md bg-ink px-4 text-sm text-ivory hover:bg-gold-dark">
              + Nouveau produit
            </Link>
          </div>
        }
      />

      {products.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone bg-white/60 py-16 text-center text-sm text-muted">Aucun produit. Créez le premier !</p>
      ) : (
        <ul className="divide-y divide-stone/60 overflow-hidden rounded-lg border border-stone/70 bg-white">
          {products.map((p) => {
            const img = p.colors.find((c) => c.images?.length)?.images?.[0];
            const stock = totalStock(p);
            return (
              <li key={p.id} className="relative flex items-center gap-3 p-3 hover:bg-sand/40 sm:gap-4 sm:px-4">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-sand">
                  {img ? (
                    <Image src={img} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <AbayaArt color={p.colors[0]?.hex ?? "#141414"} cut={p.cut} className="h-full w-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/produits/${p.id}`} className="block truncate after:absolute after:inset-0">
                    {p.name}
                    {p.bundle && <span className="ms-2 rounded bg-gold/15 px-1.5 py-0.5 text-[0.65rem] text-gold-dark">Ensemble</span>}
                    {!p.active && <span className="ms-2 rounded bg-stone/50 px-1.5 py-0.5 text-[0.65rem] text-muted">Masqué</span>}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    {catName(p.category)} ·{" "}
                    {p.bundle
                      ? p.bundleParts
                        ? p.bundleParts.map((b) => `${b.name} (${b.color})`).join(" + ")
                        : "pièce introuvable"
                      : `${p.colors.length} couleur${p.colors.length > 1 ? "s" : ""}`}
                    {p.featured ? " · Sélection" : ""}
                    {p.isNew ? " · Nouveau" : ""}
                  </p>
                </div>
                <div className="hidden text-end sm:block">
                  <p className="text-sm tabular-nums">{dh(p.price)}</p>
                  <p className={`text-xs ${stock === 0 ? "text-sold" : "text-muted"}`}>{stock === 0 ? "Épuisé" : `${stock} en stock`}</p>
                </div>
                <div className="relative z-10">
                  <ActiveToggle id={p.id} active={p.active} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
