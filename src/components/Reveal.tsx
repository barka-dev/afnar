"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  variant?: "up" | "fade" | "left" | "right" | "scale" | "clip";
  delay?: number;
  className?: string;
}

/** Fades/slides its content in when it scrolls into view. */
export default function Reveal({ children, as: Tag = "div", variant = "up", delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The "clip" variant starts fully clipped (clip-path: inset(100% 0 0 0)); some browsers then report it as never
    // intersecting, so it would stay hidden for good. Watch its parent instead, which is laid out at the same place.
    const target = variant === "clip" && el.parentElement ? el.parentElement : el;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [variant]);

  return (
    <Tag
      ref={ref}
      data-variant={variant}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
