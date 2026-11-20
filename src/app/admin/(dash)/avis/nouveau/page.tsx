import type { Metadata } from "next";
import Link from "next/link";
import { readProducts } from "@/lib/server/catalog";
import { PageHeader } from "../../../_ui/ui";
import ReviewForm from "../ReviewForm";

export const metadata: Metadata = { title: "Nouvel avis" };
export const dynamic = "force-dynamic";

export default async function NewReviewPage() {
  const products = await readProducts();
  return (
    <>
      <Link href="/admin/avis" className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← Avis
      </Link>
      <PageHeader title="Nouvel avis" />
      <ReviewForm products={products} />
    </>
  );
}
