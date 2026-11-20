"use client";

import { usePathname } from "next/navigation";
import { STORE } from "@/lib/config";
import { useI18n } from "@/i18n/I18nProvider";
import { WhatsAppIcon } from "./Icons";

export default function WhatsAppFloat() {
  const { t } = useI18n();
  const pathname = usePathname();
  if (pathname.endsWith("/commande")) return null;
  const text = encodeURIComponent(t.whatsapp.general(STORE.name));
  return (
    <a
      href={`https://wa.me/${STORE.whatsappNumber}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.whatsapp.floatAria}
      className="wa-float group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] end-4 z-30 flex items-center gap-3 rounded-full bg-ink py-3 ps-3 pe-3 text-ivory shadow-lg transition-all sm:bottom-6 sm:end-6 duration-500 ease-[var(--ease-luxe)] hover:bg-[#1f8f4e] hover:pe-5"
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[0.65rem] uppercase tracking-[0.2em] transition-all duration-500 ease-[var(--ease-luxe)] group-hover:max-w-40">
        {t.whatsapp.floatLabel}
      </span>
    </a>
  );
}
