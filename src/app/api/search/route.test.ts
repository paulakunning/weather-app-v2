import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/errors";
import { searchPlaces } from "@/lib/geocoding/geocoding";
import type { Place } from "@/lib/weather/types";
import { GET } from "./route";

vi.mock("@/lib/geocoding/geocoding");

const cordoba: Place = {
  id: 3860259,
  name: "Córdoba",
  region: "Córdoba",
  country: "Argentina",
  latitude: -31.4135,
  longitude: -64.18105,
};

function search(query: string) {
  return GET(new Request(`http://localhost/api/search${query}`));
}

beforeEach(() => {
  vi.mocked(searchPlaces).mockReset().mockResolvedValue([cordoba]);
});

describe("GET /api/search", () => {
  it("returns the places for the query and language, cacheable for an hour", async () => {
    const res = await search("?q=cor&lang=es");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ results: [cordoba] });
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=3600");
    expect(searchPlaces).toHaveBeenCalledWith("cor", "es");
  });

  it("falls back to English for an unknown language", async () => {
    await search("?q=cor&lang=fr");
    expect(searchPlaces).toHaveBeenCalledWith("cor", "en");
  });

  it("rejects queries longer than 100 characters", async () => {
    expect((await search(`?q=${"a".repeat(100)}`)).status).toBe(200);

    const res = await search(`?q=${"a".repeat(101)}`);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "query_too_long" });
    expect(searchPlaces).toHaveBeenCalledTimes(1);
  });

  it("answers 502 when Open-Meteo fails", async () => {
    vi.mocked(searchPlaces).mockRejectedValue(new UpstreamError("down", 500));
    const res = await search("?q=cor&lang=en");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "upstream" });
  });
});
