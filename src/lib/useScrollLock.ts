"use client";

import { useEffect, useState } from "react";

let locks = 0;
let savedY = 0;

/**
 * Stops the page behind an overlay (menu, cart, modal) from scrolling, including on iOS Safari,
 * where `overflow: hidden` on <body> alone is ignored. Several overlays can lock at once.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const body = document.body;
    if (locks++ === 0) {
      savedY = window.scrollY;
      const gap = window.innerWidth - document.documentElement.clientWidth; // avoid layout shift on desktop
      Object.assign(body.style, {
        position: "fixed",
        top: `-${savedY}px`,
        left: "0",
        right: "0",
        overflow: "hidden",
        paddingRight: gap ? `${gap}px` : "",
      });
    }
    return () => {
      if (--locks === 0) {
        Object.assign(body.style, { position: "", top: "", left: "", right: "", overflow: "", paddingRight: "" });
        window.scrollTo({ top: savedY, behavior: "instant" as ScrollBehavior });
      }
    };
  }, [locked]);
}

/**
 * True while `ref` is out of view on the given side: "above" = scrolled past it, "below" = not reached yet.
 * Uses scroll position rather than IntersectionObserver so a fast fling or an anchor jump can't skip it.
 */
export function useOutOfView(ref: React.RefObject<HTMLElement | null>, side: "above" | "below", deps: unknown[] = []) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return setOut(false);
        const r = el.getBoundingClientRect();
        setOut(side === "above" ? r.bottom < 0 : r.top > window.innerHeight);
      });
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, side, ...deps]);
  return out;
}

/** Toggles a flag on <body> while a fixed bottom bar is shown, so the WhatsApp button can move above it. */
export function useBottomBarFlag(visible: boolean) {
  useEffect(() => {
    if (!visible) return;
    document.body.dataset.bottomBar = "";
    return () => {
      delete document.body.dataset.bottomBar;
    };
  }, [visible]);
}
