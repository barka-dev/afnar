import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readProducts, readReviews } from "@/lib/server/catalog";
import { PageHeader } from "../../../_ui/ui";
import ReviewForm from "../ReviewForm";

export const metadata: Metadata = { title: "Modifier l'avis" };
export const dynamic = "force-dynamic";

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [reviews, products] = await Promise.all([readReviews(), readProducts()]);
  const review = reviews.find((r) => r.id === id);
  if (!review) notFound();
  return (
    <>
      <Link href="/admin/avis" className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← Avis
      </Link>
      <PageHeader title={`Avis de ${review.name}`} />
      <ReviewForm key={review.id} review={review} products={products} />
    </>
  );
}
