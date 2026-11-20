"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STORE } from "@/lib/config";
import { logout } from "../actions";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/admin/commandes", label: "Commandes", icon: "M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" },
  { href: "/admin/produits", label: "Produits", icon: "M8 3h8l3 5-3 2v11H8V10L5 8l3-5Z" },
  { href: "/admin/categories", label: "Catégories", icon: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z" },
  { href: "/admin/avis", label: "Avis", icon: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" },
];

export default function AdminNav({ newOrders }: { newOrders: number }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <aside className="sticky top-0 z-30 border-b border-stone/70 bg-ivory/95 backdrop-blur lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-e">
      <div className="flex h-14 items-center justify-between px-4 lg:h-20 lg:px-6">
        <Link href="/admin" className="leading-none">
          <span dir="ltr" className="font-serif text-2xl tracking-[0.3em]">
            {STORE.name}
          </span>
          <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-gold-dark">Admin</span>
        </Link>
        <div className="flex items-center gap-1 lg:hidden">
          <a href="/fr" target="_blank" className="rounded-md px-3 py-2 text-xs text-muted hover:bg-sand hover:text-ink">
            Boutique ↗
          </a>
          <form action={logout}>
            <button className="rounded-md px-3 py-2 text-xs text-muted hover:bg-sand hover:text-ink">Déconnexion</button>
          </form>
        </div>
      </div>

      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active(l.href) ? "page" : undefined}
            className="flex min-h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm text-muted transition-colors hover:bg-sand hover:text-ink aria-[current=page]:bg-ink aria-[current=page]:text-ivory"
          >
            <svg viewBox="0 0 24 24" className="hidden h-[18px] w-[18px] lg:block" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
              <path d={l.icon} />
            </svg>
            {l.label}
            {l.href === "/admin/commandes" && newOrders > 0 && (
              <span className="ms-auto rounded-full bg-gold px-2 py-0.5 text-[0.7rem] leading-none text-white">{newOrders}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="hidden space-y-1 border-t border-stone/70 p-3 lg:block">
        <a href="/fr" target="_blank" className="flex min-h-10 items-center rounded-md px-3 text-sm text-muted hover:bg-sand hover:text-ink">
          Voir la boutique ↗
        </a>
        <form action={logout}>
          <button className="flex min-h-10 w-full items-center rounded-md px-3 text-sm text-muted hover:bg-sand hover:text-ink">Déconnexion</button>
        </form>
      </div>
    </aside>
  );
}
