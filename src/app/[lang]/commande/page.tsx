import type { Metadata } from "next";
import CheckoutForm from "./CheckoutForm";
import { alternates, getDictionary, hasLocale } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/commande">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.meta.checkoutTitle, description: t.meta.checkoutDescription, alternates: alternates(lang, "/commande") };
}

export default function CheckoutPage() {
  return <CheckoutForm />;
}
