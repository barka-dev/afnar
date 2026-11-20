import type { Metadata } from "next";
import Link from "next/link";
import { readCategories } from "@/lib/server/catalog";
import { PageHeader } from "../../../_ui/ui";
import ProductForm from "../ProductForm";

export const metadata: Metadata = { title: "Nouveau produit" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await readCategories();
  return (
    <>
      <Link href="/admin/produits" className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← Produits
      </Link>
      <PageHeader title="Nouveau produit" />
      <ProductForm categories={categories} />
    </>
  );
}
