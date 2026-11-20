"use client";

import { useEffect, useRef } from "react";
import AbayaArt from "./AbayaArt";

/** Two arched frames with a gentle scroll parallax. */
export default function HeroVisual({ caption }: { caption: string }) {
  const back = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 900);
        if (back.current) back.current.style.transform = `translate3d(0, ${y * -0.08}px, 0)`;
        if (front.current) front.current.style.transform = `translate3d(0, ${y * 0.06}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px] sm:max-w-[520px]">
      <div ref={back} className="absolute end-0 top-0 w-[62%] will-change-transform">
        <div className="arch relative aspect-[3/4.4] animate-fade-in bg-sand" style={{ animationDelay: "200ms" }}>
          <div className="absolute inset-0 animate-slow-zoom">
            <AbayaArt color="#0F4C3A" cut="brodee" className="h-full w-full" />
          </div>
        </div>
      </div>
      <div ref={front} className="absolute bottom-0 start-0 w-[58%] will-change-transform">
        <div className="arch relative aspect-[3/4.4] animate-fade-in border-[6px] border-ivory bg-sand" style={{ animationDelay: "450ms" }}>
          <div className="absolute inset-0 animate-slow-zoom">
            <AbayaArt color="#141414" cut="classique" className="h-full w-full" />
          </div>
        </div>
      </div>
      <p className="absolute bottom-2 end-0 hidden text-[0.6rem] uppercase tracking-[0.45em] text-muted md:block">
        {caption}
      </p>
    </div>
  );
}
