import "server-only";
import type { Locale } from "@/i18n/config";
import { UpstreamError } from "@/lib/errors";
import type { Place } from "@/lib/weather/types";
import {
  geocodingPlaceSchema,
  searchResponseSchema,
  type GeocodingPlace,
} from "./schema";

const BASE_URL = "https://geocoding-api.open-meteo.com/v1";
const CACHE = { next: { revalidate: 86400 } };

function toPlace(place: GeocodingPlace): Place {
  return {
    id: place.id,
    name: place.name,
    region: place.admin1,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

export async function searchPlaces(
  query: string,
  locale: Locale,
): Promise<Place[]> {
  const name = query.trim();
  if (name.length < 2) return [];

  const params = new URLSearchParams({ name, count: "5", language: locale });
  const res = await fetch(`${BASE_URL}/search?${params}`, CACHE);
  if (!res.ok) {
    throw new UpstreamError("geocoding search failed", res.status);
  }
  const parsed = searchResponseSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new UpstreamError("invalid geocoding response");
  }
  return (parsed.data.results ?? []).map(toPlace);
}

export async function getPlaceById(
  id: number,
  locale: Locale,
): Promise<Place | null> {
  const params = new URLSearchParams({ id: String(id), language: locale });
  const res = await fetch(`${BASE_URL}/get?${params}`, CACHE);
  // Open-Meteo answers an unknown id with 400 { error: true }.
  if (res.status === 400) return null;
  if (!res.ok) {
    throw new UpstreamError("geocoding lookup failed", res.status);
  }
  const parsed = geocodingPlaceSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new UpstreamError("invalid geocoding response");
  }
  return toPlace(parsed.data);
}
