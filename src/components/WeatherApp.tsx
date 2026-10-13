"use client";

import { MotionConfig } from "motion/react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/en";
import { setPreferenceCookie } from "@/lib/cookies";
import { deriveScene } from "@/lib/scene";
import { themeToCss } from "@/lib/sky/theme";
import { UNIT_COOKIE, type TemperatureUnit } from "@/lib/units";
import type { Forecast } from "@/lib/weather/types";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Metrics } from "./Metrics";
import { SunArc } from "./SunArc";
import { Temperature } from "./Temperature";

type WeatherAppProps = {
  forecast: Forecast;
  initialUnit: TemperatureUnit;
  locale: Locale;
  dict: Dictionary;
};

// shortcut: the selected time is always now and search does nothing until the ruler (Block 7) and search (Block 8) exist
const noop = () => {};

export function WeatherApp({
  forecast,
  initialUnit,
  locale,
  dict,
}: WeatherAppProps) {
  const [unit, setUnit] = useState(initialUnit);
  const scene = deriveScene(forecast, forecast.current.time);

  function changeUnit(next: TemperatureUnit) {
    setUnit(next);
    setPreferenceCookie(UNIT_COOKIE, next);
  }

  return (
    <MotionConfig reducedMotion="user">
      {/* Later in the document than the layout's default sky, so it wins. */}
      <style>{themeToCss(scene.theme)}</style>
      <div className="mx-auto flex min-h-dvh max-w-[1720px] flex-col px-4 pt-7 pb-6 md:px-16">
        <Header
          place={forecast.place}
          forecast={forecast}
          status={scene.status}
          unit={unit}
          onUnitChange={changeUnit}
          locale={locale}
          dict={dict}
          onOpenSearch={noop}
          onBackToLive={noop}
        />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 py-4 text-(--ink-mid)">
          <SunArc
            sun={scene.sun}
            daylight={scene.daylight}
            timeZone={forecast.timezone}
            locale={locale}
            dict={dict}
          />
          <Temperature
            celsius={scene.point.temperature}
            unit={unit}
            condition={scene.condition}
            feelsLikeCelsius={scene.point.apparentTemperature}
            dict={dict}
          />
          <Metrics point={scene.point} dict={dict} />
        </main>
        <Footer forecast={forecast} locale={locale} dict={dict} />
      </div>
    </MotionConfig>
  );
}
