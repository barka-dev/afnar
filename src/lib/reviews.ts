/** Language a review was written in → HTML lang and text direction for its text and transcript. */
export const REVIEW_LANG_META = {
  ar: { htmlLang: "ar-MA", dir: "rtl" },
  fr: { htmlLang: "fr-MA", dir: "ltr" },
} as const;
import type { Cut } from "@/lib/products";

/**
 * Customer reviews (shown on /avis and on the home page).
 * A review can be any mix of: text, photos and a voice note. They are added in the admin dashboard (/admin/avis).
 */

export type ReviewPhoto =
  /** Uploaded photo URL */
  | { src: string; width?: number; height?: number }
  /** Illustration (placeholder) */
  | { art: { cut: Cut; color: string } };

export interface ReviewVoice {
  /** Uploaded audio URL */
  src: string;
  /** Length in seconds (shown before the file is loaded) */
  duration: number;
  /** What she says, in the language she speaks — shown under the player and read by screen readers */
  transcript?: string;
}

export interface Review {
  id: string;
  /** First name + initial, e.g. "Salma B." */
  name: string;
  /** French city name, as in src/lib/cities.ts */
  city: string;
  /** YYYY-MM-DD */
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  /**
   * Language the customer wrote / spoke the review in (sets text direction). Independent of the shop's
   * language: the shop is Arabic only, but a customer may still send her review in French.
   */
  lang: "ar" | "fr";
  text?: string;
  photos?: ReviewPhoto[];
  voice?: ReviewVoice;
  /** What she bought (links to the product) */
  product?: { slug: string; color?: string; size?: string };
  /** Bought from the store (order confirmed) */
  verified?: boolean;
  /** Shown on the site (false = hidden draft) */
  published?: boolean;
}

export const hasText = (r: Review) => !!r.text?.trim();
export const hasPhotos = (r: Review) => !!r.photos?.length;
export const hasVoice = (r: Review) => !!r.voice;

export function reviewStats(list: Review[]) {
  const count = list.length;
  const average = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  const byStars = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: list.filter((r) => r.rating === stars).length }));
  return {
    count,
    average,
    byStars,
    photos: list.filter(hasPhotos).length,
    voice: list.filter(hasVoice).length,
    text: list.filter((r) => hasText(r) && !hasPhotos(r) && !hasVoice(r)).length,
  };
}
