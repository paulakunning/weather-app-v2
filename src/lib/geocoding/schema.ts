import "server-only";
import { z } from "zod";

// admin1 and country are missing for some places (e.g. small towns).
export const geocodingPlaceSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  admin1: z.string().optional(),
  country: z.string().optional(),
});

// Open-Meteo omits `results` when nothing matches.
export const searchResponseSchema = z.object({
  results: z.array(geocodingPlaceSchema).optional(),
});

export type GeocodingPlace = z.infer<typeof geocodingPlaceSchema>;
