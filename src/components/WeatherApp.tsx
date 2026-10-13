"use client";

import { MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/en";
import { setPreferenceCookie } from "@/lib/cookies";
import { useWheelScrub } from "@/lib/hooks/use-wheel-scrub";
import { deriveScene } from "@/lib/scene";
import { themeToCss } from "@/lib/sky/theme";
import { UNIT_COOKIE, type TemperatureUnit } from "@/lib/units";
import type { Forecast } from "@/lib/weather/types";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Metrics } from "./Metrics";
import { SearchOverlay } from "./SearchOverlay";
import { SunArc } from "./SunArc";
import { Temperature } from "./Temperature";
import { Timeline } from "./Timeline";

type WeatherAppProps = {
  forecast: Forecast;
  initialUnit: TemperatureUnit;
  locale: Locale;
  dict: Dictionary;
};

export function WeatherApp({
  forecast,
  initialUnit,
  locale,
  dict,
}: WeatherAppProps) {
  const [unit, setUnit] = useState(initialUnit);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState(forecast.current.time);
  const scene = deriveScene(forecast, selected);
  const first = forecast.hours[0]?.time ?? selected;
  const last = forecast.hours.at(-1)?.time ?? selected;

  useWheelScrub({
    enabled: !searchOpen,
    onDelta: (seconds) =>
      setSelected((time) => Math.min(Math.max(time + seconds, first), last)),
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // "/" opens search, unless the person is typing in a text field (the ruler is a range input).
      const target = event.target;
      if (event.key !== "/") return;
      if (
        target instanceof Element &&
        target.closest('input:not([type="range"]), textarea, [contenteditable]')
      )
        return;
      event.preventDefault();
      setSearchOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function changeUnit(next: TemperatureUnit) {
    setUnit(next);
    setPreferenceCookie(UNIT_COOKIE, next);
  }

  return (
    <MotionConfig reducedMotion="user">
      {/* Later in the document than the layout's default sky, so it wins. */}
      <style>{themeToCss(scene.theme)}</style>
      <div className="mx-auto flex min-h-dvh max-w-[1720px] flex-col px-4 pt-4 pb-3 md:px-16 md:pt-7 md:pb-6">
        <Header
          place={forecast.place}
          forecast={forecast}
          status={scene.status}
          unit={unit}
          onUnitChange={changeUnit}
          locale={locale}
          dict={dict}
          onOpenSearch={() => setSearchOpen(true)}
          onBackToLive={() => setSelected(forecast.current.time)}
        />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 py-2 text-(--ink-mid) md:gap-6 md:py-4">
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
        <Timeline
          hours={forecast.hours}
          value={selected}
          onChange={setSelected}
          timeZone={forecast.timezone}
          locale={locale}
          unit={unit}
          dict={dict}
          now={forecast.current.time}
          country={forecast.place.country}
        />
        <Footer forecast={forecast} locale={locale} dict={dict} />
      </div>
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        locale={locale}
        dict={dict}
      />
    </MotionConfig>
  );
}
