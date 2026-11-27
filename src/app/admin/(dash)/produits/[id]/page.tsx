import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readCategories, readProducts, readSizeOptions } from "@/lib/server/catalog";
import { isOneSize } from "@/lib/products";
import { PageHeader } from "../../../_ui/ui";
import ProductForm from "../ProductForm";
import EnsembleForm from "../EnsembleForm";

export const metadata: Metadata = { title: "Modifier le produit" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [products, categories, sizeOptions] = await Promise.all([readProducts(), readCategories(), readSizeOptions()]);
  const product = products.find((p) => p.id === id);
  if (!product) notFound();
  const pieces = products.filter((p) => !p.bundle);
  return (
    <>
      <Link href="/admin/produits" className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← Produits
      </Link>
      <PageHeader
        title={product.name}
        subtitle={product.bundle ? "Ensemble : abaya + khimar" : undefined}
        actions={
          product.active ? (
            <a href={`/produit/${product.slug}`} target="_blank" className="inline-flex min-h-10 items-center rounded-md border border-stone bg-white px-4 text-sm hover:border-ink">
              Voir dans la boutique ↗
            </a>
          ) : undefined
        }
      />
      {product.bundle ? (
        <EnsembleForm key={product.id} ensemble={product} abayas={pieces.filter((p) => !isOneSize(p))} khimars={pieces.filter((p) => isOneSize(p))} />
      ) : (
        <ProductForm key={product.id} product={product} categories={categories} sizeOptions={sizeOptions} />
      )}
    </>
  );
}
