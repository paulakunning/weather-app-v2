"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Dictionary } from "@/i18n/en";
import { toUnit, type TemperatureUnit } from "@/lib/units";
import type { WeatherCondition } from "@/lib/weather-codes";

type TemperatureProps = {
  celsius: number;
  unit: TemperatureUnit;
  condition: WeatherCondition;
  feelsLikeCelsius: number;
  dict: Dictionary;
};

export function Temperature({
  celsius,
  unit,
  condition,
  feelsLikeCelsius,
  dict,
}: TemperatureProps) {
  const value = toUnit(celsius, unit);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Sizes are the Figma 250 px numeral scaled down on narrow screens. */}
      <p className="font-display relative text-[min(250px,40vw)] leading-none tracking-[-0.05em] [text-shadow:0_0_80px_rgba(247,171,130,0.2),0_0_35px_rgba(255,230,215,0.4)]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={value}
            className="inline-block"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
        <span
          aria-hidden
          className="absolute -top-[0.064em] -right-[0.224em] text-[0.352em] opacity-95"
        >
          °
        </span>
        <span className="sr-only"> {dict.degrees}</span>
      </p>
      <p className="mt-4 text-2xl/7 font-light tracking-[0.6px]">
        {dict.conditions[condition]}
      </p>
      <p className="mt-1.5 text-sm/[22px] tracking-[0.7px] text-(--ink-mid-2)">
        {dict.feelsLike}{" "}
        <span className="font-medium text-(--ink-mid)">
          {toUnit(feelsLikeCelsius, unit)}°
        </span>
      </p>
    </div>
  );
}
