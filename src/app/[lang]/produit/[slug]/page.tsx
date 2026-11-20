import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductDetail from "./ProductDetail";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { categoryName, localizeProduct } from "@/lib/products";
import { getCategories, getProduct, getProducts } from "@/lib/server/catalog";
import { LOCALES, alternates, formatPrice, getDictionary, hasLocale, localePath } from "@/i18n";

export async function generateStaticParams() {
  const products = await getProducts();
  return LOCALES.flatMap((lang) => products.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/produit/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = await getProduct(slug);
  if (!p || !hasLocale(lang)) return {};
  const lp = localizeProduct(p, lang);
  return {
    title: lp.name,
    description: getDictionary(lang).meta.productDescription(lp.shortDescription, formatPrice(p.price, lang)),
    alternates: alternates(lang, `/produit/${slug}`),
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/produit/[slug]">) {
  const { lang, slug } = await params;
  const product = await getProduct(slug);
  if (!product || !hasLocale(lang)) notFound();
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const category = categories.find((c) => c.slug === product.category);
  const t = getDictionary(lang);

  const related = products
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, 4);

  return (
    <>
      <nav className="mx-auto max-w-7xl truncate px-4 pt-5 text-[0.62rem] uppercase tracking-[0.22em] text-muted sm:px-5 sm:pt-8 md:px-10" aria-label={t.nav.breadcrumb}>
        <Link href={localePath(lang, "/")} className="link-underline hover:text-ink">{t.nav.home}</Link>
        <span className="mx-2">/</span>
        {category && (
          <>
            <Link href={localePath(lang, `/boutique?categorie=${category.slug}`)} className="link-underline hover:text-ink">
              {categoryName(category, lang)}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-ink">{localizeProduct(product, lang).name}</span>
      </nav>

      <ProductDetail product={product} />

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-5 md:mt-32 md:px-10">
        <Reveal className="text-center">
          <p className="eyebrow">{t.product.relatedEyebrow}</p>
          <h2 className="mt-4 font-serif text-4xl font-light">{t.product.relatedTitle}</h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:mt-14 sm:gap-x-5 sm:gap-y-14 md:gap-x-8 lg:grid-cols-4">
          {related.map((p, i) => (
            <Reveal key={p.slug} delay={i * 100}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
