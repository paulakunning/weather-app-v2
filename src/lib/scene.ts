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

// `now` defaults to the data's own time so the server and the first client render
// agree; after mount the client passes the device clock.
export function deriveScene(
  forecast: Forecast,
  selected: number,
  now = forecast.current.time,
): Scene {
  const { current, hours, place } = forecast;
  const status = timelineStatus(selected, now);
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
  // Drops only when the code says rain; millimeters set how strong they look.
  const rainOpacity = isRainy(condition)
    ? Math.min(0.3 + point.precipitation * 0.15, 0.8)
    : 0;

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
      rainOpacity,
    ),
  };
}
