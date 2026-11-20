import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readCategories, readProducts } from "@/lib/server/catalog";
import { PageHeader } from "../../../_ui/ui";
import ProductForm from "../ProductForm";

export const metadata: Metadata = { title: "Modifier le produit" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [products, categories] = await Promise.all([readProducts(), readCategories()]);
  const product = products.find((p) => p.id === id);
  if (!product) notFound();
  return (
    <>
      <Link href="/admin/produits" className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← Produits
      </Link>
      <PageHeader
        title={product.name}
        actions={
          product.active ? (
            <a href={`/fr/produit/${product.slug}`} target="_blank" className="inline-flex min-h-10 items-center rounded-md border border-stone bg-white px-4 text-sm hover:border-ink">
              Voir dans la boutique ↗
            </a>
          ) : undefined
        }
      />
      <ProductForm key={product.id} product={product} categories={categories} />
    </>
  );
}
