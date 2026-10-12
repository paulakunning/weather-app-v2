import "server-only";
import { z } from "zod";

const numbers = z.array(z.number());
const nullableNumbers = z.array(z.number().nullable());
// The sky palette expects 0–100; anything else would produce odd colors.
const cloudCover = z.number().min(0).max(100);

export const forecastResponseSchema = z.object({
  timezone: z.string(),
  timezone_abbreviation: z.string(),
  current: z.object({
    time: z.number(),
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number(),
    weather_code: z.number(),
    cloud_cover: cloudCover,
    wind_speed_10m: z.number(),
    wind_direction_10m: z.number(),
    pressure_msl: z.number(),
    precipitation: z.number(),
  }),
  hourly: z.object({
    time: numbers,
    temperature_2m: numbers,
    apparent_temperature: numbers,
    relative_humidity_2m: numbers,
    precipitation_probability: nullableNumbers,
    precipitation: numbers,
    weather_code: numbers,
    cloud_cover: z.array(cloudCover),
    wind_speed_10m: numbers,
    wind_direction_10m: numbers,
    pressure_msl: numbers,
    visibility: nullableNumbers,
  }),
  daily: z.object({
    time: numbers,
    sunrise: numbers,
    sunset: numbers,
  }),
});

export type ForecastResponse = z.infer<typeof forecastResponseSchema>;
