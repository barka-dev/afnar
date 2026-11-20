import { StarMotif } from "./Icons";
import { getDictionary, shippingText, type Locale } from "@/i18n";

export default function AnnouncementBar({ locale }: { locale: Locale }) {
  const messages = getDictionary(locale).announcement(shippingText(locale));
  const row = (
    <div className="flex shrink-0 items-center">
      {messages.map((m) => (
        <span key={m} className="flex items-center gap-10 px-5">
          <span>{m}</span>
          <StarMotif className="h-3 w-3 text-gold" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden bg-ink py-2.5 text-[0.62rem] uppercase tracking-[0.28em] text-ivory/90">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] rtl:animate-marquee-rtl">
        {row}
        {row}
      </div>
    </div>
  );
}
