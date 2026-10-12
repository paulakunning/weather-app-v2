export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}

export function matchLocale(
  acceptLanguage: string | null,
  cookieValue: string | undefined,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;

  const languages = (acceptLanguage ?? "")
    .split(",")
    .map((entry) => {
      const [tag = "", ...params] = entry.split(";").map((s) => s.trim());
      const q = params.find((param) => param.startsWith("q="));
      return {
        language: tag.split("-")[0]?.toLowerCase(),
        q: q ? Number(q.slice(2)) : 1,
      };
    })
    // Drops q=0 ("not acceptable") and malformed q values (NaN).
    .filter((entry) => entry.q > 0)
    // sort is stable, so equal q keeps the header's order.
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.language);

  return languages.find(isLocale) ?? defaultLocale;
}
