import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PlaceView } from "@/components/PlaceView";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseCoordinates } from "@/lib/coordinates";
import { getPlaceById } from "@/lib/geocoding/geocoding";
import type { Place } from "@/lib/weather/types";

const DEFAULT_PLACE_ID = 3435910; // Buenos Aires

type SearchParams = Awaited<PageProps<"/[lang]">["searchParams"]>;

async function resolvePlace(
  lang: Locale,
  { lat, lon }: SearchParams,
): Promise<Place> {
  if (lat !== undefined || lon !== undefined) {
    // Repeated params (?lat=1&lat=2) arrive as arrays and count as invalid.
    const coordinates = parseCoordinates(
      typeof lat === "string" ? lat : undefined,
      typeof lon === "string" ? lon : undefined,
    );
    if (!coordinates) redirect(`/${lang}`);
    return { id: null, name: getDictionary(lang).yourLocation, ...coordinates };
  }
  return (await getPlaceById(DEFAULT_PLACE_ID, lang)) ?? notFound();
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const place = await resolvePlace(lang, await searchParams);
  const query =
    place.id === null ? `?lat=${place.latitude}&lon=${place.longitude}` : "";

  return {
    title: `${place.name} — Weather App`,
    alternates: {
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `/${locale}${query}`]),
      ),
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const place = await resolvePlace(lang, await searchParams);

  return <PlaceView place={place} locale={lang} />;
}
