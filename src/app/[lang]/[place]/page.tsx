import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PlaceView } from "@/components/PlaceView";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getPlaceById } from "@/lib/geocoding/geocoding";
import { parsePlaceParam, placePath } from "@/lib/slug";
import type { Place } from "@/lib/weather/types";

async function resolvePlace(lang: Locale, param: string): Promise<Place> {
  const parsed = parsePlaceParam(param);
  if (!parsed) notFound();
  const place = await getPlaceById(parsed.id, lang);
  if (!place) notFound();
  // Compare with the full canonical path, not slugify(name): names without
  // Latin letters get the "city" fallback slug, which slugify never returns.
  const canonical = placePath(place.name, parsed.id);
  if (param !== canonical) permanentRedirect(`/${lang}/${canonical}`);
  return place;
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/[place]">): Promise<Metadata> {
  const { lang, place: param } = await params;
  if (!isLocale(lang)) notFound();
  const place = await resolvePlace(lang, param);

  return {
    title: `${place.name} — Weather App`,
    alternates: {
      // shortcut: alternate URL reuses this locale's slug and redirects to the canonical one; resolve per-locale names if SEO matters
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `/${locale}/${param}`]),
      ),
    },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/[place]">) {
  const { lang, place: param } = await params;
  if (!isLocale(lang)) notFound();
  const place = await resolvePlace(lang, param);

  return <PlaceView place={place} locale={lang} />;
}
