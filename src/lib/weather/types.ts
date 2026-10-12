import "server-only";
import type { SunTimes } from "@/lib/time";

export type Place = {
  id: number | null; // null = "Your location"
  name: string;
  region?: string; // admin1
  country?: string;
  latitude: number;
  longitude: number;
};

export type HourPoint = {
  time: number; // unix seconds, UTC
  temperature: number; // °C
  apparentTemperature: number; // °C
  humidity: number; // %
  precipitationProbability: number | null; // %, null on some models
  precipitation: number; // mm
  weatherCode: number; // WMO code
  cloudCover: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees
  pressure: number; // hPa
  visibility: number | null; // meters, null on some models
};

export type Forecast = {
  place: Place;
  timezone: string;
  timezoneAbbreviation: string;
  current: HourPoint;
  hours: HourPoint[];
  sun: SunTimes[];
  fetchedAt: number;
};
