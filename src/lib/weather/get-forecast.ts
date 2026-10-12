import "server-only";
import { UpstreamError } from "@/lib/errors";
import { normalizeForecast } from "./normalize";
import { forecastResponseSchema } from "./schema";
import type { Forecast, Place } from "./types";

// 24 hourly points (current hour at index 3) and sun times for yesterday, today and tomorrow.
const QUERY =
  "timezone=auto&timeformat=unixtime&past_hours=3&forecast_hours=21&past_days=1&forecast_days=2" +
  "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,pressure_msl,precipitation" +
  "&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,pressure_msl,visibility" +
  "&daily=sunrise,sunset";

export async function getForecast(place: Place): Promise<Forecast> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&${QUERY}`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) {
    throw new UpstreamError("forecast request failed", res.status);
  }
  const parsed = forecastResponseSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new UpstreamError("invalid forecast response");
  }
  return normalizeForecast(parsed.data, place);
}
