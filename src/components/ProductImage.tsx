"use client";

import Image from "next/image";
import { useI18n } from "@/i18n/I18nProvider";
import AbayaArt from "./AbayaArt";
import { colorLabel, productName, type Product, type ProductColor } from "@/lib/products";

interface Props {
  product: Product;
  color: ProductColor;
  view?: "front" | "detail";
  /** index into color.images when real photos exist */
  index?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/** Renders a real photo when available, otherwise the tinted illustration. */
export default function ProductImage({ product, color, view = "front", index, className = "", sizes, priority }: Props) {
  const { locale } = useI18n();
  const i = index ?? (view === "detail" ? 1 : 0);
  const src = color.images?.[i] ?? color.images?.[0];
  if (src) {
    return (
      <Image
        src={src}
        alt={`${productName(product, locale)} — ${colorLabel(color, locale)}`}
        fill
        sizes={sizes ?? "(min-width: 1024px) 33vw, 50vw"}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }
  return <AbayaArt color={color.hex} cut={product.cut} view={view} className={`absolute inset-0 h-full w-full ${className}`} />;
}
