"use client";

import Image from "next/image";
import AbayaArt from "@/components/AbayaArt";
import type { ReviewPhoto } from "@/lib/reviews";

/** A customer photo (fills its positioned parent). Demo reviews use the illustration instead. */
export default function ReviewPhotoView({
  photo,
  alt,
  sizes,
  fit = "cover",
}: {
  photo: ReviewPhoto;
  alt: string;
  sizes: string;
  fit?: "cover" | "contain";
}) {
  if ("art" in photo) {
    return (
      <span role="img" aria-label={alt} className="absolute inset-0 block bg-gradient-to-b from-sand to-stone/70">
        <AbayaArt color={photo.art.color} cut={photo.art.cut} view="front" className="absolute inset-0 h-full w-full" />
      </span>
    );
  }
  return <Image src={photo.src} alt={alt} fill sizes={sizes} className={fit === "cover" ? "object-cover" : "object-contain"} />;
}
