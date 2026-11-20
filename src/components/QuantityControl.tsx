"use client";

import { useI18n } from "@/i18n/I18nProvider";

interface Props {
  value: number;
  max: number;
  onChange: (v: number) => void;
  small?: boolean;
  min?: number;
}

export default function QuantityControl({ value, max, onChange, small, min = 0 }: Props) {
  const { t } = useI18n();
  const h = small ? "h-9" : "h-12";
  const w = small ? "w-9" : "w-10 md:w-12";
  return (
    <div dir="ltr" className={`inline-flex items-center border border-stone ${h}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= Math.max(min, small ? 0 : 1)}
        className={`${w} h-full transition-colors hover:bg-sand disabled:opacity-30`}
        aria-label={t.qty.decrease}
      >
        −
      </button>
      <span className={`${small ? "w-7 text-xs" : "w-8 text-sm md:w-10"} text-center tabular-nums`}>{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`${w} h-full transition-colors hover:bg-sand disabled:opacity-30`}
        aria-label={t.qty.increase}
      >
        +
      </button>
    </div>
  );
}
