import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "./Icons";

/**
 * Home hero: a full-width cover photo with the title, text and buttons over it.
 * To change the photo, replace public/hero/cover.jpg (portrait or landscape, about 1800px wide is plenty;
 * keep the abayas in the middle: the text side is darkened). Adjust the crop with the object-[x_y] classes.
 */
export default function HeroCover({
  eyebrow,
  title1,
  title2,
  text,
  cta,
  cta2,
  ctaHref,
  cta2Href,
  image,
}: {
  eyebrow: string;
  title1: string;
  title2: string;
  text: string;
  cta: string;
  cta2: string;
  ctaHref: string;
  cta2Href: string;
  image: string;
}) {
  return (
    <section className="relative h-[min(88svh,52rem)] min-h-[34rem] overflow-hidden bg-ink text-ivory">
      <Image src={image} alt="" fill priority sizes="100vw" className="object-cover object-[50%_30%] md:object-[50%_40%]" />

      {/* Legibility: darker on the text side (right in Arabic), and from the bottom on phones */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/60 to-ink/10 md:bg-gradient-to-l md:from-ink/80 md:via-ink/40 md:to-transparent" />

      <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-14 sm:px-5 md:items-center md:px-10 md:pb-0">
        <div className="max-w-xl">
          <p className="eyebrow animate-fade-in !text-gold">{eyebrow}</p>
          <h1
            className="mt-5 animate-fade-in font-serif text-[2.9rem] font-light leading-[1.05] sm:mt-6 sm:text-6xl md:text-7xl rtl:leading-[1.3]"
            style={{ animationDelay: "120ms" }}
          >
            {title1}
            <br />
            <em className="text-gold">{title2}</em>
          </h1>
          <p className="mt-6 max-w-md animate-fade-in leading-relaxed text-ivory/85 sm:mt-8" style={{ animationDelay: "240ms" }}>
            {text}
          </p>
          <div className="mt-8 flex flex-col gap-3 animate-fade-in sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4" style={{ animationDelay: "360ms" }}>
            <Link href={ctaHref} className="btn btn-primary w-full !border-ivory !bg-ivory !text-ink sm:w-auto">
              {cta} <ArrowIcon className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
            <Link href={cta2Href} className="btn btn-light w-full sm:w-auto">
              {cta2}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
