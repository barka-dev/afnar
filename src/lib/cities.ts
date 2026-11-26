import type { Locale } from "@/i18n/config";

/**
 * Moroccan cities. The French name is the value stored in the order and used
 * for shipping fees (see SHIPPING.cityFees); `ar` is only for display.
 */
export const CITIES: { fr: string; ar: string }[] = [
  { fr: "Casablanca", ar: "الدار البيضاء" },
  { fr: "Rabat", ar: "الرباط" },
  { fr: "Salé", ar: "سلا" },
  { fr: "Témara", ar: "تمارة" },
  { fr: "Mohammedia", ar: "المحمدية" },
  { fr: "Marrakech", ar: "مراكش" },
  { fr: "Fès", ar: "فاس" },
  { fr: "Tanger", ar: "طنجة" },
  { fr: "Meknès", ar: "مكناس" },
  { fr: "Agadir", ar: "أكادير" },
  { fr: "Oujda", ar: "وجدة" },
  { fr: "Kénitra", ar: "القنيطرة" },
  { fr: "Tétouan", ar: "تطوان" },
  { fr: "El Jadida", ar: "الجديدة" },
  { fr: "Safi", ar: "آسفي" },
  { fr: "Béni Mellal", ar: "بني ملال" },
  { fr: "Nador", ar: "الناظور" },
  { fr: "Khouribga", ar: "خريبكة" },
  { fr: "Settat", ar: "سطات" },
  { fr: "Berrechid", ar: "برشيد" },
  { fr: "Larache", ar: "العرائش" },
  { fr: "Ksar El Kébir", ar: "القصر الكبير" },
  { fr: "Khémisset", ar: "الخميسات" },
  { fr: "Taza", ar: "تازة" },
  { fr: "Guelmim", ar: "كلميم" },
  { fr: "Errachidia", ar: "الرشيدية" },
  { fr: "Ouarzazate", ar: "ورزازات" },
  { fr: "Essaouira", ar: "الصويرة" },
  { fr: "Al Hoceïma", ar: "الحسيمة" },
  { fr: "Laâyoune", ar: "العيون" },
  { fr: "Dakhla", ar: "الداخلة" },
  { fr: "Tiznit", ar: "تيزنيت" },
  { fr: "Taroudant", ar: "تارودانت" },
  { fr: "Inezgane", ar: "إنزكان" },
  { fr: "Ait Melloul", ar: "أيت ملول" },
  { fr: "Berkane", ar: "بركان" },
  { fr: "Chefchaouen", ar: "شفشاون" },
  { fr: "Ifrane", ar: "إفران" },
  { fr: "Azrou", ar: "أزرو" },
  { fr: "Sidi Kacem", ar: "سيدي قاسم" },
  { fr: "Sidi Slimane", ar: "سيدي سليمان" },
  { fr: "Fquih Ben Salah", ar: "الفقيه بن صالح" },
  { fr: "Benslimane", ar: "بنسليمان" },
  { fr: "Bouskoura", ar: "بوسكورة" },
  { fr: "Dar Bouazza", ar: "دار بوعزة" },
  { fr: "Martil", ar: "مرتيل" },
  { fr: "M'diq", ar: "المضيق" },
  { fr: "Fnideq", ar: "الفنيدق" },
  { fr: "Autre ville", ar: "مدينة أخرى" },
];

export const MOROCCAN_CITIES = CITIES.map((c) => c.fr);

/** Arabic name of a city. Cities are stored by their French name (their id in orders), never shown as such. */
export function cityLabel(city: string, _locale: Locale): string {
  return CITIES.find((c) => c.fr === city)?.ar ?? city;
}
