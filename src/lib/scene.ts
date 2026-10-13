import { sunAltitude } from "@/lib/sky/sun";
import { skyTheme, type SkyTheme } from "@/lib/sky/theme";
import {
  daylightFraction,
  nearestHourIndex,
  sunTimesFor,
  timelineStatus,
  type SunTimes,
  type TimelineStatus,
} from "@/lib/time";
import {
  conditionFromCode,
  isRainy,
  type WeatherCondition,
} from "@/lib/weather-codes";
import type { Forecast, HourPoint } from "@/lib/weather/types";

export type Scene = {
  point: HourPoint;
  status: TimelineStatus;
  condition: WeatherCondition;
  sun: SunTimes | null;
  daylight: number | null;
  theme: SkyTheme;
};

export function deriveScene(forecast: Forecast, selected: number): Scene {
  const { current, hours, place } = forecast;
  // current.time, not Date.now(): server and client must derive the same scene.
  const status = timelineStatus(selected, current.time);
  const point =
    status === "live"
      ? current
      : (hours[
          nearestHourIndex(
            hours.map((h) => h.time),
            selected,
          )
        ] ?? current);
  const condition = conditionFromCode(point.weatherCode);
  const sun = sunTimesFor(forecast.sun, selected);
  const altitude = sunAltitude(selected, place.latitude, place.longitude);

  return {
    point,
    status,
    condition,
    sun,
    daylight: sun ? daylightFraction(selected, sun) : null,
    theme: skyTheme(
      altitude,
      point.cloudCover,
      isRainy(condition) || point.precipitation > 0,
    ),
  };
}
