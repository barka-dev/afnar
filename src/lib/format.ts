// Shop prices are formatted with formatPrice in src/i18n (Arabic: "1 290 درهم").

/** 1290 -> "1 290 DH": for the store team (admin dashboard, Telegram), which works in French. */
export function formatDH(value: number): string {
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} DH`;
}

/** Normalises a Moroccan mobile number to 06XXXXXXXX / 07XXXXXXXX, or null if invalid. */
export function normalizeMoroccanPhone(input: string): string | null {
  const digits = input.replace(/[\s.\-()]/g, "");
  const match = digits.match(/^(?:\+212|00212|212|0)([5-7]\d{8})$/);
  return match ? `0${match[1]}` : null;
}

export function generateOrderRef(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AF-${yy}${mm}${dd}-${rand}`;
}
