// Central store settings — edit these to configure the shop.

export const STORE = {
  name: "AFNAR",
  // Store WhatsApp for the contact links on the site. International format, no "+" and no spaces.
  // Overridable with NEXT_PUBLIC_WHATSAPP_NUMBER. (Orders are sent to Telegram: see src/lib/server/telegram.ts.)
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "212664553194",
  email: "contact@afnar.ma",
  instagram: "https://instagram.com/afnar.ma",
};

export const SHIPPING = {
  // Free delivery from this order subtotal (DH)
  freeThreshold: 1000,
  // Fee per city (DH). Cities not listed use `defaultFee`.
  cityFees: {
    Casablanca: 20,
    Mohammedia: 25,
    Rabat: 30,
    Salé: 30,
    Témara: 30,
  } as Record<string, number>,
  defaultFee: 35,
  // Delivery delays in hours (wording is localised in src/i18n/dictionaries)
  delayLocalHours: 24,
  delayNationalHours: [24, 72] as [number, number],
  localCity: "Casablanca",
};

export function shippingFee(city: string, subtotal: number): number {
  if (!city) return 0;
  if (subtotal >= SHIPPING.freeThreshold) return 0;
  return SHIPPING.cityFees[city] ?? SHIPPING.defaultFee;
}

