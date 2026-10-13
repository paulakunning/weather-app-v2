"use client";

import type { Dictionary } from "@/i18n/en";
import { formatHour, formatTime, nearestHourIndex } from "@/lib/time";
import { toUnit, type TemperatureUnit } from "@/lib/units";
import type { HourPoint } from "@/lib/weather/types";

type TimelineProps = {
  hours: HourPoint[];
  value: number;
  onChange: (value: number) => void;
  timeZone: string;
  locale: string;
  unit: TemperatureUnit;
  dict: Dictionary;
  now: number;
  country?: string;
};

const HOUR = 3600;

export function Timeline({
  hours,
  value,
  onChange,
  timeZone,
  locale,
  unit,
  dict,
  now,
  country,
}: TimelineProps) {
  const times = hours.map((h) => h.time);
  const min = times[0] ?? value;
  const max = times.at(-1) ?? value;
  const at = (time: number) => `${((time - min) / (max - min || 1)) * 100}%`;
  const selected = nearestHourIndex(times, value);
  const temperature = toUnit(hours[selected]?.temperature ?? 0, unit);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const step = {
      ArrowRight: HOUR,
      ArrowUp: HOUR,
      ArrowLeft: -HOUR,
      ArrowDown: -HOUR,
    }[event.key];
    if (step === undefined) return; // Home/End and the rest stay native.
    event.preventDefault();
    onChange(Math.min(Math.max(value + step, min), max));
  }

  return (
    <section className="mx-auto w-full max-w-[1152px] text-(--ink-bottom)">
      <div className="flex items-center justify-between gap-4 px-2 text-[11px]/[16.5px]">
        <p className="tracking-[1.1px] text-(--ink-bottom-2) uppercase max-md:hidden">
          {dict.timeline.title}
        </p>
        <p className="flex items-center gap-1.5 font-medium tracking-[0.55px] whitespace-nowrap lowercase">
          <span aria-hidden className="size-1.5 rounded-full bg-[#f7ab82]" />
          {dict.timeline.now} {formatTime(now, timeZone, locale)}
        </p>
        <p className="tracking-[1.1px] text-(--ink-bottom-2) uppercase">
          {country}
        </p>
      </div>

      <div className="group relative px-4 pt-3 pb-2">
        <input
          type="range"
          min={min}
          max={max}
          step={60}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          onKeyDown={onKeyDown}
          aria-label={dict.timeline.label}
          aria-valuetext={`${formatTime(value, timeZone, locale)}, ${temperature} ${dict.degrees}`}
          // Invisible but on top: dragging, keys and screen readers all use the native slider.
          className="peer absolute inset-0 z-10 w-full cursor-pointer opacity-0"
        />
        <div aria-hidden className="pointer-events-none relative h-[60px]">
          <div className="absolute inset-x-0 top-[31px] h-px bg-(--ink-bottom)/20" />
          {hours.slice(0, -1).map((hour) => (
            <span
              key={`half-${hour.time}`}
              className="absolute top-[26px] h-1.5 w-px bg-(--ink-bottom)/20"
              style={{ left: at(hour.time + HOUR / 2) }}
            />
          ))}
          {hours.map((hour, i) => {
            const label = formatHour(hour.time, timeZone, locale);
            const isSelected = i === selected;
            // Below 768 px only every third hour keeps its labels.
            const labelClass = Number(label) % 3 === 0 ? "" : "max-md:hidden";
            return (
              <div
                key={hour.time}
                className={`absolute top-0 flex -translate-x-1/2 flex-col items-center ${isSelected ? "font-bold" : ""}`}
                style={{ left: at(hour.time) }}
              >
                <span
                  className={`text-[13px]/4 tracking-[0.26px] ${labelClass}`}
                >
                  {toUnit(hour.temperature, unit)}°
                </span>
                <span
                  className={`mt-1.5 ${isSelected ? "h-4 w-[1.5px] bg-(--ink-bottom)" : "h-3 w-px bg-(--ink-bottom)/40"}`}
                />
                <span
                  className={`mt-1 text-[11px]/[16.5px] tracking-[0.55px] ${isSelected ? "" : "text-(--ink-bottom-2)"} ${labelClass}`}
                >
                  {label}
                </span>
              </div>
            );
          })}
          <div
            className="absolute top-[10px] flex -translate-x-1/2 flex-col items-center gap-[2px]"
            style={{ left: at(value) }}
          >
            {/* The slider is a separate layer, so focus is read through the group. */}
            <span className="size-2.5 rotate-45 bg-(--ink-bottom) shadow-[0_0_12px_rgba(247,171,130,0.9)] outline-(--ink-bottom) group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2" />
            <span className="h-9 w-[1.5px] bg-(--ink-bottom) shadow-[0_0_8px_rgba(247,171,130,0.8)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
