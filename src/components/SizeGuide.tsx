"use client";

import { useEffect } from "react";
import { SIZE_GUIDE } from "@/lib/products";
import { CloseIcon } from "./Icons";
import { useI18n } from "@/i18n/I18nProvider";
import { useScrollLock } from "@/lib/useScrollLock";

export default function SizeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const g = t.sizeGuide;
  useScrollLock(open);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5 ${open ? "visible" : "invisible"}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-ink/40 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} />
      <div
        role="dialog"
        aria-label={g.title}
        className={`relative max-h-[88dvh] w-full max-w-lg overflow-y-auto overscroll-contain bg-ivory px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 transition-all duration-500 ease-[var(--ease-luxe)] sm:max-h-[90dvh] sm:p-8 md:p-12 ${
          open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 sm:translate-y-6"
        }`}
      >
        <button onClick={onClose} className="absolute end-2 top-2 flex h-11 w-11 items-center justify-center transition-transform duration-500 hover:rotate-90 sm:end-4 sm:top-4" aria-label={t.common.close}>
          <CloseIcon />
        </button>
        <p className="eyebrow">{g.eyebrow}</p>
        <h2 className="mt-3 font-serif text-3xl">{g.title}</h2>
        <p className="mt-3 text-sm text-muted">
          {g.intro}
        </p>
        <table className="mt-6 w-full text-sm sm:mt-8">
          <thead>
            <tr className="border-b border-ink text-start text-[0.62rem] uppercase tracking-[0.2em]">
              <th className="py-3 font-normal">{g.size}</th>
              <th className="py-3 font-normal">{g.length}</th>
              <th className="py-3 font-normal">{g.height}</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_GUIDE.map((r) => (
              <tr key={r.size} className="border-b border-stone/70 transition-colors hover:bg-sand/60">
                <td className="py-3 font-serif text-lg">{r.size}</td>
                <td className="py-3 text-muted">{g.cm(r.lengthCm)}</td>
                <td className="py-3 text-muted">{g.heightRange(...r.heightCm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6 text-xs text-muted">{g.tip}</p>
      </div>
    </div>
  );
}
