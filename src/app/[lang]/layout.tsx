import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/jost/300.css";
import "@fontsource/jost/400.css";
// Arabic glyphs only (unicode-range), so Latin text keeps Cormorant / Jost
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/amiri/arabic-700.css";
import "@fontsource/tajawal/arabic-300.css";
import "@fontsource/tajawal/arabic-400.css";
import "@fontsource/tajawal/arabic-500.css";
import "../globals.css";
import { CartProvider } from "@/context/CartContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import { LOCALES, LOCALE_META, alternates, getDictionary, hasLocale } from "@/i18n";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { CatalogProvider } from "@/context/CatalogContext";
import { getCategories, getProducts } from "@/lib/server/catalog";
import { comingSoonSlugs } from "@/lib/products";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: { default: t.meta.title, template: "%s · AFNAR" },
    description: t.meta.description,
    alternates: alternates(lang),
    openGraph: {
      title: t.meta.ogTitle,
      description: t.meta.ogDescription,
      locale: LOCALE_META[lang].og,
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f8f5f0",
  width: "device-width",
  initialScale: 1,
  // lets fixed bars use env(safe-area-inset-*) on iPhones with a notch / home indicator
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const meta = LOCALE_META[lang];
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <body className="min-h-screen">
        <I18nProvider locale={lang}>
          <CatalogProvider products={products} categories={categories}>
            <CartProvider>
              <AnnouncementBar locale={lang} />
              <Header />
              <main>{children}</main>
              <Footer locale={lang} categories={categories} comingSoon={[...comingSoonSlugs(categories, products)]} />
              <CartDrawer />
              <WhatsAppFloat />
            </CartProvider>
          </CatalogProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
