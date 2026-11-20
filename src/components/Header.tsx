"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { BagIcon, CloseIcon, MenuIcon } from "./Icons";
import { STORE } from "@/lib/config";
import { useI18n } from "@/i18n/I18nProvider";
import LanguageSwitcher from "./LanguageSwitcher";
import { useScrollLock } from "@/lib/useScrollLock";

export default function Header() {
  const pathname = usePathname();
  const { t, href } = useI18n();
  const NAV = [
    { href: href("/"), label: t.nav.home },
    { href: href("/boutique"), label: t.nav.shop },
    { href: href("/boutique?categorie=brodee"), label: t.nav.embroidered, wideOnly: true },
    { href: href("/avis"), label: t.nav.reviews },
    { href: href("/#maison"), label: t.nav.maison },
    { href: href("/#commander"), label: t.nav.howToOrder },
  ];
  const { count, openCart, hydrated } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);
  useScrollLock(menuOpen);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!hydrated || count === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [count, hydrated]);

  return (
    <>
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ease-[var(--ease-luxe)] ${
        scrolled ? "bg-ivory/85 shadow-[0_1px_0_rgba(26,23,20,0.06)] backdrop-blur-md" : "bg-ivory"
      }`}
    >
      <div
        className={`mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 transition-all duration-500 sm:px-5 md:px-10 ${
          scrolled ? "" : "md:h-20"
        }`}
      >
        <div className="flex items-center">
          <button
            className="-ms-2.5 flex h-11 w-11 items-center justify-center lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label={t.nav.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <MenuIcon />
          </button>
          <nav className="hidden gap-8 lg:flex">
            {NAV.slice(0, 4).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`link-underline text-[0.68rem] uppercase tracking-[0.24em] ${n.wideOnly ? "hidden xl:inline" : ""}`}
                aria-current={pathname === n.href ? "page" : undefined}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href={href("/")} className="text-center" aria-label={t.nav.homeAria(STORE.name)}>
          <span dir="ltr" className="keep-tracking block font-serif text-[1.7rem] leading-none tracking-[0.34em] ps-[0.34em] sm:text-3xl sm:tracking-[0.38em] sm:ps-[0.38em] md:text-[2.1rem]">
            {STORE.name}
          </span>
          <span
            className={`mt-1 block overflow-hidden text-[0.5rem] uppercase tracking-[0.42em] text-gold-dark transition-all duration-500 sm:text-[0.55rem] sm:tracking-[0.5em] ${
              scrolled ? "h-0 opacity-0" : "h-3 opacity-100"
            }`}
          >
            {t.common.tagline}
          </span>
        </Link>

        <div className="flex items-center justify-end gap-4 lg:gap-8">
          <nav className="hidden gap-8 lg:flex">
            {NAV.slice(4).map((n) => (
              <Link key={n.href} href={n.href} className="link-underline text-[0.68rem] uppercase tracking-[0.24em]">
                {n.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher className="hidden sm:flex" />
          <button onClick={openCart} className="relative -me-2.5 flex h-11 w-11 items-center justify-center" aria-label={t.nav.cartAria(count)}>
            <BagIcon className="h-[22px] w-[22px]" />
            {hydrated && count > 0 && (
              <span
                className={`absolute end-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] text-ivory transition-transform duration-300 ${
                  bump ? "scale-125" : "scale-100"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

    </header>

      {/* Mobile menu — rendered outside <header>: its backdrop-blur would otherwise trap this fixed panel inside the header */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.openMenu}
        className={`fixed inset-0 z-50 flex h-dvh flex-col bg-ivory transition-all duration-700 ease-[var(--ease-luxe)] lg:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-stone/60 px-4 sm:px-5">
          <span dir="ltr" className="keep-tracking font-serif text-2xl tracking-[0.38em]">{STORE.name}</span>
          <button onClick={() => setMenuOpen(false)} className="-me-2.5 flex h-11 w-11 items-center justify-center" aria-label={t.nav.closeMenu}>
            <CloseIcon />
          </button>
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-6 pt-4 sm:px-8">
          {NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMenuOpen(false)}
              aria-current={pathname === n.href ? "page" : undefined}
              className={`border-b border-stone/60 py-4 font-serif text-[1.75rem] leading-tight transition-all aria-[current=page]:text-gold-dark sm:py-5 sm:text-3xl duration-700 ease-[var(--ease-luxe)] ${
                menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
              style={{ transitionDelay: menuOpen ? `${150 + i * 70}ms` : "0ms" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="shrink-0 space-y-5 border-t border-stone/60 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-8">
          <LanguageSwitcher large />
          <p className="text-xs uppercase tracking-[0.22em] text-muted">{t.nav.mobileFooter}</p>
        </div>
      </div>
    </>
  );
}
