import type { Metadata } from "next";
import { readCategories, readProducts } from "@/lib/server/catalog";
import { PageHeader } from "../../_ui/ui";
import CategoryManager from "./CategoryManager";

export const metadata: Metadata = { title: "Catégories" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([readCategories(), readProducts()]);
  const counts = Object.fromEntries(categories.map((c) => [c.slug, products.filter((p) => p.category === c.slug).length]));
  return (
    <>
      <PageHeader title="Catégories" subtitle="Affichées dans la boutique, sur l'accueil et dans le pied de page, dans cet ordre." />
      <CategoryManager categories={categories} counts={counts} />
    </>
  );
}
