import type { Metadata } from "next";
import ShopView from "./ShopView";
import { getCategories } from "@/lib/server/catalog";
import { alternates, getDictionary, hasLocale } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/boutique">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.meta.shopTitle, description: t.meta.shopDescription, alternates: alternates(lang, "/boutique") };
}

export default async function ShopPage({ searchParams }: PageProps<"/[lang]/boutique">) {
  const { categorie } = await searchParams;
  const categories = await getCategories();
  const initial = categories.some((c) => c.slug === categorie) ? String(categorie) : "all";
  return <ShopView initialCategory={initial} />;
}
