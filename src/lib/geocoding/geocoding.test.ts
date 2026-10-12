import { afterEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/errors";
import { mockFetch } from "@/test/mock-fetch";
import { getPlaceById, searchPlaces } from "./geocoding";

afterEach(() => vi.unstubAllGlobals());

// Real Open-Meteo bodies (2026-10-12), trimmed to the fields we read plus a few extra.
const coBody = {
  results: [
    {
      id: 2373340,
      name: "Có",
      latitude: 12.08333,
      longitude: -15.8,
      feature_code: "PPL",
      country: "Guinea-Bissáu",
    },
  ],
  generationtime_ms: 0.17,
};
const londonBody = {
  id: 2643743,
  name: "Londres",
  latitude: 51.50853,
  longitude: -0.12574,
  timezone: "Europe/London",
  country: "Reino Unido",
  admin1: "Inglaterra",
};

describe("searchPlaces", () => {
  it("searches by name in the given language, cached for a day", async () => {
    const fetchMock = mockFetch(coBody);
    const places = await searchPlaces("co", "es");

    expect(places).toEqual([
      {
        id: 2373340,
        name: "Có",
        country: "Guinea-Bissáu",
        latitude: 12.08333,
        longitude: -15.8,
      },
    ]);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toContain("/v1/search?");
    expect(url).toContain("name=co");
    expect(url).toContain("count=5");
    expect(url).toContain("language=es");
    expect(init).toEqual({ next: { revalidate: 86400 } });
  });

  it("returns [] without fetching when the trimmed query is shorter than 2", async () => {
    const fetchMock = mockFetch(coBody);
    expect(await searchPlaces(" c ", "en")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns [] when Open-Meteo sends no results key", async () => {
    mockFetch({ generationtime_ms: 0.1 });
    expect(await searchPlaces("zzqqxx", "en")).toEqual([]);
  });

  it("rejects with UpstreamError when Open-Meteo fails", async () => {
    mockFetch({}, 503);
    await expect(searchPlaces("co", "en")).rejects.toThrow(UpstreamError);
  });
});

describe("getPlaceById", () => {
  it("returns the place in the given language", async () => {
    const fetchMock = mockFetch(londonBody);
    expect(await getPlaceById(2643743, "es")).toEqual({
      id: 2643743,
      name: "Londres",
      region: "Inglaterra",
      country: "Reino Unido",
      latitude: 51.50853,
      longitude: -0.12574,
    });
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(url).toContain("/v1/get?id=2643743&language=es");
  });

  it("returns null for an unknown id", async () => {
    mockFetch({ error: true, reason: "Location ID not found." }, 400);
    expect(await getPlaceById(999999999, "en")).toBeNull();
  });

  it("rejects with UpstreamError on other failures", async () => {
    mockFetch({}, 500);
    await expect(getPlaceById(2643743, "en")).rejects.toThrow(UpstreamError);
  });

  it("rejects with UpstreamError when the body does not match the schema", async () => {
    mockFetch({ id: 2643743 });
    await expect(getPlaceById(2643743, "en")).rejects.toThrow(UpstreamError);
  });
});
