"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCatalog } from "./CatalogContext";
import { stockFor, type Product, type ProductColor, type Size } from "@/lib/products";

export interface CartItem {
  slug: string;
  color: string;
  size: Size;
  qty: number;
}

export interface ResolvedCartItem extends CartItem {
  key: string;
  product: Product;
  colorData: ProductColor;
  maxQty: number;
  lineTotal: number;
}

interface CartContextValue {
  items: ResolvedCartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  updateQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "afnar-cart-v1";

export const itemKey = (i: Pick<CartItem, "slug" | "color" | "size">) => `${i.slug}|${i.color}|${i.size}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [raw, setRaw] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { getProduct } = useCatalog();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRaw(JSON.parse(stored));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch {
      /* ignore */
    }
  }, [raw, hydrated]);

  // Resolve against the catalogue so prices and stock are always current.
  const items = useMemo<ResolvedCartItem[]>(() => {
    const out: ResolvedCartItem[] = [];
    for (const i of raw) {
      const product = getProduct(i.slug);
      const colorData = product?.colors.find((c) => c.name === i.color);
      if (!product || !colorData) continue;
      const maxQty = stockFor(colorData, i.size);
      if (maxQty <= 0) continue;
      const qty = Math.min(i.qty, maxQty);
      out.push({ ...i, qty, key: itemKey(i), product, colorData, maxQty, lineTotal: qty * product.price });
    }
    return out;
  }, [raw, getProduct]);

  const addItem = useCallback((item: CartItem) => {
    setRaw((prev) => {
      const k = itemKey(item);
      const existing = prev.find((p) => itemKey(p) === k);
      if (existing) return prev.map((p) => (itemKey(p) === k ? { ...p, qty: p.qty + item.qty } : p));
      return [...prev, item];
    });
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    setRaw((prev) =>
      qty <= 0 ? prev.filter((p) => itemKey(p) !== key) : prev.map((p) => (itemKey(p) === key ? { ...p, qty } : p))
    );
  }, []);

  const removeItem = useCallback((key: string) => setRaw((prev) => prev.filter((p) => itemKey(p) !== key)), []);
  const clear = useCallback(() => setRaw([]), []);

  const value: CartContextValue = {
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.lineTotal, 0),
    hydrated,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    updateQty,
    removeItem,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
