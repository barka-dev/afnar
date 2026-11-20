import type { Metadata } from "next";
import ReviewsView from "./ReviewsView";
import { alternates, getDictionary, hasLocale } from "@/i18n";
import { getReviews } from "@/lib/server/catalog";

export async function generateMetadata({ params }: PageProps<"/[lang]/avis">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.meta.reviewsTitle, description: t.meta.reviewsDescription, alternates: alternates(lang, "/avis") };
}

export default async function ReviewsPage() {
  return <ReviewsView reviews={await getReviews()} />;
}
