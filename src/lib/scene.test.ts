import { describe, expect, it } from "vitest";
import { formatHour } from "@/lib/time";
import fixture from "@/lib/weather/__fixtures__/buenos-aires.json";
import { normalizeForecast } from "@/lib/weather/normalize";
import { forecastResponseSchema } from "@/lib/weather/schema";
import { deriveScene } from "./scene";

const forecast = normalizeForecast(forecastResponseSchema.parse(fixture), {
  id: 3435910,
  name: "Buenos Aires",
  latitude: -34.61315,
  longitude: -58.37723,
});

function hour(index: number) {
  const point = forecast.hours[index];
  if (!point) throw new Error(`No hour ${index}`);
  return point;
}

describe("deriveScene", () => {
  it("uses the current values when live", () => {
    const scene = deriveScene(forecast, forecast.current.time);
    expect(scene.status).toBe("live");
    expect(scene.point).toBe(forecast.current);
  });

  it("uses the nearest hour in the future", () => {
    const scene = deriveScene(forecast, hour(10).time);
    expect(scene.status).toBe("forecast");
    expect(scene.point).toBe(hour(10));
  });

  it("marks the past as earlier", () => {
    expect(deriveScene(forecast, hour(0).time).status).toBe("earlier");
  });

  it("has no daylight at local 03:00 and some at 13:00", () => {
    const at = (label: string) => {
      const point = forecast.hours.find(
        (h) => formatHour(h.time, forecast.timezone, "en") === label,
      );
      if (!point) throw new Error(`No ${label}:00 in the fixture`);
      return deriveScene(forecast, point.time);
    };
    expect(at("03").daylight).toBeNull();
    expect(at("13").daylight).toBeGreaterThan(0);
  });

  it("paints a day sky at noon and a night sky at 03:00", () => {
    const noon = deriveScene(forecast, hour(3).time).theme.colors.top;
    const night = deriveScene(forecast, hour(17).time).theme.colors.top;
    expect(noon).not.toBe(night);
  });
});
