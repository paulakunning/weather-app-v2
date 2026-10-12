import { describe, expect, it } from "vitest";
import { UpstreamError } from "@/lib/errors";
import fixture from "./__fixtures__/buenos-aires.json";
import { normalizeForecast } from "./normalize";
import { forecastResponseSchema } from "./schema";
import type { Place } from "./types";

const raw = forecastResponseSchema.parse(fixture);

const place: Place = {
  id: 3435910,
  name: "Buenos Aires",
  region: "Buenos Aires F.D.",
  country: "Argentina",
  latitude: -34.61315,
  longitude: -58.37723,
};

describe("forecastResponseSchema", () => {
  it("rejects a response without the expected fields", () => {
    expect(forecastResponseSchema.safeParse({}).success).toBe(false);
  });

  it("rejects cloud cover outside 0–100", () => {
    const broken = structuredClone(fixture);
    broken.current.cloud_cover = 101;
    expect(forecastResponseSchema.safeParse(broken).success).toBe(false);
  });
});

describe("normalizeForecast", () => {
  const forecast = normalizeForecast(raw, place);

  it("keeps the 24 hourly points with the current hour at index 3", () => {
    expect(forecast.hours).toHaveLength(24);
    const offset = raw.current.time - (forecast.hours[3]?.time ?? 0);
    expect(offset).toBeGreaterThanOrEqual(0);
    expect(offset).toBeLessThan(3600);
  });

  it("takes current values from raw.current and the rest from the current hour", () => {
    expect(forecast.current.temperature).toBe(raw.current.temperature_2m);
    expect(forecast.current.visibility).toBe(forecast.hours[3]?.visibility);
    expect(forecast.current.precipitationProbability).toBe(
      forecast.hours[3]?.precipitationProbability,
    );
    expect(forecast.fetchedAt).toBe(raw.current.time);
  });

  it("returns the three days of sun times", () => {
    expect(forecast.sun).toHaveLength(3);
    forecast.sun.forEach((sun, i) => {
      expect(sun).toEqual({
        day: raw.daily.time[i],
        sunrise: raw.daily.sunrise[i],
        sunset: raw.daily.sunset[i],
      });
    });
  });

  it("passes the place and time zone through", () => {
    expect(forecast.place).toBe(place);
    expect(forecast.timezone).toBe(raw.timezone);
    expect(forecast.timezoneAbbreviation).toBe(raw.timezone_abbreviation);
  });

  it("keeps a missing visibility as null", () => {
    const withGap = structuredClone(raw);
    withGap.hourly.visibility[5] = null;
    expect(normalizeForecast(withGap, place).hours[5]?.visibility).toBeNull();
  });

  it("throws UpstreamError when hourly arrays differ in length", () => {
    const short = structuredClone(raw);
    short.hourly.temperature_2m.pop();
    expect(() => normalizeForecast(short, place)).toThrow(UpstreamError);
  });

  it("throws UpstreamError when daily arrays differ in length", () => {
    const short = structuredClone(raw);
    short.daily.sunset.pop();
    expect(() => normalizeForecast(short, place)).toThrow(UpstreamError);
  });

  it("throws UpstreamError when there are no hourly points", () => {
    const empty = structuredClone(raw);
    for (const values of Object.values(empty.hourly)) values.length = 0;
    expect(() => normalizeForecast(empty, place)).toThrow(UpstreamError);
  });
});
