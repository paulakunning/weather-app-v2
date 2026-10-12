"use client";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/en";
import { toUnit, type TemperatureUnit } from "@/lib/units";
import type { Forecast } from "@/lib/weather/types";

type WeatherAppProps = {
  forecast: Forecast;
  initialUnit: TemperatureUnit;
  locale: Locale;
  dict: Dictionary;
};

// Temporary: plain text until the screen components land in Block 6.
export function WeatherApp({ forecast, initialUnit, dict }: WeatherAppProps) {
  return (
    <main>
      <h1>{forecast.place.name}</h1>
      <p>{toUnit(forecast.current.temperature, initialUnit)}°</p>
      <p>{dict.status.live}</p>
    </main>
  );
}
