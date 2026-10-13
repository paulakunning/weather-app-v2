import { Fragment } from "react";
import type { Dictionary } from "@/i18n/en";
import { compassPoint } from "@/lib/units";
import type { HourPoint } from "@/lib/weather/types";

export function Metrics({
  point,
  dict,
}: {
  point: HourPoint;
  dict: Dictionary;
}) {
  const metrics = [
    {
      label: dict.metrics.wind,
      value: `${Math.round(point.windSpeed)} km/h`,
      suffix: dict.compass[compassPoint(point.windDirection)],
    },
    { label: dict.metrics.humidity, value: `${Math.round(point.humidity)}%` },
    {
      label: dict.metrics.precipitation,
      value:
        point.precipitationProbability === null
          ? "—"
          : `${Math.round(point.precipitationProbability)}%`,
    },
    {
      label: dict.metrics.pressure,
      value: `${Math.round(point.pressure)} hPa`,
    },
  ];

  return (
    <ul className="flex w-full max-w-[672px] flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-(--ink-mid)/15 px-4 pt-7 md:justify-between">
      {metrics.map(({ label, value, suffix }, i) => (
        <Fragment key={label}>
          {i > 0 && (
            <li
              aria-hidden
              className="hidden text-sm/5 text-(--ink-mid)/20 md:block"
            >
              ·
            </li>
          )}
          <li className="flex items-baseline gap-2">
            <span className="text-[10px]/5 tracking-[1px] text-(--ink-mid-2) uppercase">
              {label}
            </span>
            <span className="text-sm/5 font-medium">{value}</span>
            {suffix && (
              <span className="text-xs tracking-[1.4px] text-(--ink-mid-2)">
                {suffix}
              </span>
            )}
          </li>
        </Fragment>
      ))}
    </ul>
  );
}
