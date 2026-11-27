import type { Metadata } from "next";
import Link from "next/link";
import { readProducts } from "@/lib/server/catalog";
import { isOneSize } from "@/lib/products";
import { PageHeader } from "../../../_ui/ui";
import EnsembleForm from "../EnsembleForm";

export const metadata: Metadata = { title: "Nouvel ensemble" };
export const dynamic = "force-dynamic";

/** New set (الأطقم): an abaya + a matching khimar at their own price. */
export default async function NewEnsemblePage() {
  const products = (await readProducts()).filter((p) => !p.bundle);
  return (
    <>
      <Link href="/admin/produits" className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← Produits
      </Link>
      <PageHeader title="Nouvel ensemble" subtitle="Une abaya + son khimar assorti, vendus ensemble à un prix choisi." />
      <EnsembleForm abayas={products.filter((p) => !isOneSize(p))} khimars={products.filter((p) => isOneSize(p))} />
    </>
  );
}
