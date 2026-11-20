const STAR = "M12 2.8l2.75 5.9 6.45.75-4.8 4.4 1.3 6.4L12 17.05 6.3 20.25l1.3-6.4-4.8-4.4 6.45-.75z";

/** Five stars filled to `value` (0–5, fractions allowed). Decorative: pass the rating as text with `label`. */
export default function Stars({ value, label, className = "h-3.5 w-3.5" }: { value: number; label?: string; className?: string }) {
  return (
    <span className="relative inline-flex shrink-0" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <span className="flex gap-0.5 text-stone">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
            <path d={STAR} />
          </svg>
        ))}
      </span>
      <span className="absolute inset-y-0 start-0 flex gap-0.5 overflow-hidden text-gold" style={{ width: `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` }}>
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} viewBox="0 0 24 24" className={`${className} shrink-0`} fill="currentColor" aria-hidden>
            <path d={STAR} />
          </svg>
        ))}
      </span>
    </span>
  );
}
