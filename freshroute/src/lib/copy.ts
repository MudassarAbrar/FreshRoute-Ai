import type { Lang } from "@/i18n"

/** Scripted dialogue line with Urdu variant. Numbers/cities/buyer names interpolate the same in both. */
export function L(lang: Lang, en: string, ur: string): string {
  return lang === "ur" ? ur : en
}
