import type { Metadata } from "next";
import ThankYou from "./ThankYou";
import { getDictionary, hasLocale } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/merci">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).meta.thanksTitle };
}

export default async function MerciPage({ searchParams }: PageProps<"/[lang]/merci">) {
  const { ref } = await searchParams;
  return <ThankYou refParam={typeof ref === "string" ? ref : ""} />;
}
