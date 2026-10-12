import { afterEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/errors";
import { mockFetch } from "@/test/mock-fetch";
import fixture from "./__fixtures__/buenos-aires.json";
import { getForecast } from "./get-forecast";
import { normalizeForecast } from "./normalize";
import { forecastResponseSchema } from "./schema";
import type { Place } from "./types";

const place: Place = {
  id: 3435910,
  name: "Buenos Aires",
  latitude: -34.61315,
  longitude: -58.37723,
};

afterEach(() => vi.unstubAllGlobals());

describe("getForecast", () => {
  it("fetches the exact query, cached for 10 minutes, and normalizes it", async () => {
    const fetchMock = mockFetch(fixture);
    const forecast = await getForecast(place);

    expect(forecast).toEqual(
      normalizeForecast(forecastResponseSchema.parse(fixture), place),
    );
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toContain("latitude=-34.61315&longitude=-58.37723");
    expect(url).toContain("past_hours=3");
    expect(url).toContain("timeformat=unixtime");
    expect(init).toEqual({ next: { revalidate: 600 } });
  });

  it("rejects with the HTTP status when Open-Meteo fails", async () => {
    mockFetch({ error: true }, 500);
    const error = await getForecast(place).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UpstreamError);
    expect(error).toHaveProperty("status", 500);
  });

  it("rejects when the body does not match the schema", async () => {
    mockFetch({});
    await expect(getForecast(place)).rejects.toThrow(UpstreamError);
  });
});
