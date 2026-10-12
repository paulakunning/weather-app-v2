import "server-only";
import { UpstreamError } from "@/lib/errors";
import { nearestHourIndex } from "@/lib/time";
import type { ForecastResponse } from "./schema";
import type { Forecast, HourPoint, Place } from "./types";

function hasSameLength(arrays: Record<string, unknown[]>): boolean {
  const lengths = Object.values(arrays).map((values) => values.length);
  return lengths.every((length) => length === lengths[0]);
}

export function normalizeForecast(
  raw: ForecastResponse,
  place: Place,
): Forecast {
  const { current: c, hourly: h, daily: d } = raw;
  if (!hasSameLength(h) || h.time.length === 0) {
    throw new UpstreamError("inconsistent hourly data");
  }
  if (!hasSameLength(d)) {
    throw new UpstreamError("inconsistent daily data");
  }

  // The length checks above guarantee every index below exists.
  const hours = h.time.map((time, i): HourPoint => ({
    time,
    temperature: h.temperature_2m[i]!,
    apparentTemperature: h.apparent_temperature[i]!,
    humidity: h.relative_humidity_2m[i]!,
    precipitationProbability: h.precipitation_probability[i] ?? null,
    precipitation: h.precipitation[i]!,
    weatherCode: h.weather_code[i]!,
    cloudCover: h.cloud_cover[i]!,
    windSpeed: h.wind_speed_10m[i]!,
    windDirection: h.wind_direction_10m[i]!,
    pressure: h.pressure_msl[i]!,
    visibility: h.visibility[i] ?? null,
  }));
  const currentHour = hours[nearestHourIndex(h.time, c.time)]!;

  return {
    place,
    timezone: raw.timezone,
    timezoneAbbreviation: raw.timezone_abbreviation,
    current: {
      time: c.time,
      temperature: c.temperature_2m,
      apparentTemperature: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      precipitationProbability: currentHour.precipitationProbability,
      precipitation: c.precipitation,
      weatherCode: c.weather_code,
      cloudCover: c.cloud_cover,
      windSpeed: c.wind_speed_10m,
      windDirection: c.wind_direction_10m,
      pressure: c.pressure_msl,
      visibility: currentHour.visibility,
    },
    hours,
    sun: d.time.map((day, i) => ({
      day,
      sunrise: d.sunrise[i]!,
      sunset: d.sunset[i]!,
    })),
    fetchedAt: c.time,
  };
}
