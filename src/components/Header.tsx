"use client";

import Link from "next/link";
import { Fragment } from "react";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/en";
import { setPreferenceCookie } from "@/lib/cookies";
import { placePath } from "@/lib/slug";
import type { TimelineStatus } from "@/lib/time";
import type { TemperatureUnit } from "@/lib/units";
import type { Forecast, Place } from "@/lib/weather/types";
import { LocalClock } from "./LocalClock";

type HeaderProps = {
  place: Place;
  forecast: Forecast;
  status: TimelineStatus;
  unit: TemperatureUnit;
  onUnitChange: (unit: TemperatureUnit) => void;
  locale: Locale;
  dict: Dictionary;
  onOpenSearch: () => void;
  onBackToLive: () => void;
};

const UNITS: { value: TemperatureUnit; label: string }[] = [
  { value: "c", label: "°C" },
  { value: "f", label: "°F" },
];

function placeHref(place: Place, locale: Locale): string {
  return place.id === null
    ? `/${locale}?lat=${place.latitude}&lon=${place.longitude}`
    : `/${locale}/${placePath(place.name, place.id)}`;
}

// Colors a Figma icon export with the zone ink; its own fill-opacity (50–70%) still applies.
function Icon({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  return (
    <span
      aria-hidden
      className="block bg-current"
      style={{ width, height, mask: `url(${src}) center / contain no-repeat` }}
    />
  );
}

function Divider() {
  return <span aria-hidden className="h-3 w-px bg-(--ink-top)/20" />;
}

function Slash() {
  return (
    <span aria-hidden className="font-light text-(--ink-top)/30">
      /
    </span>
  );
}

export function Header({
  place,
  forecast,
  status,
  unit,
  onUnitChange,
  locale,
  dict,
  onOpenSearch,
  onBackToLive,
}: HeaderProps) {
  const isLive = status === "live";

  return (
    <header className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-(--ink-top) md:justify-between md:gap-x-7">
      <div className="flex items-center gap-4">
        <h1>
          <button
            type="button"
            onClick={onOpenSearch}
            className="font-display flex cursor-pointer items-center gap-2 text-[28px]/[34px] tracking-[-0.7px]"
          >
            {place.name}
            <Icon src="/icons/chevron.svg" width={7.96} height={4.51} />
          </button>
        </h1>
        <Divider />
        <p className="flex items-baseline gap-1.5">
          <span className="text-xs font-medium tracking-[0.6px]">
            <LocalClock
              timeZone={forecast.timezone}
              locale={locale}
              initial={forecast.current.time}
            />
          </span>
          <span className="text-[10px]/[15px] tracking-[1px] text-(--ink-top-2) uppercase">
            {forecast.timezoneAbbreviation}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 md:gap-x-7">
        <button
          type="button"
          disabled={isLive}
          onClick={onBackToLive}
          title={isLive ? undefined : dict.status.backToLive}
          className="flex items-center gap-2 text-[11px]/[14px] font-semibold tracking-[1.1px] text-(--ink-top-2) uppercase enabled:cursor-pointer"
        >
          <span aria-hidden className="relative size-2">
            {isLive && (
              <span className="absolute inset-0 rounded-full bg-[#f7ab82] opacity-75 motion-safe:animate-ping" />
            )}
            <span
              className={`relative block size-2 rounded-full ${isLive ? "bg-[#ffceb5]" : "bg-(--ink-top-2)"}`}
            />
          </span>
          {dict.status[status]}
        </button>
        <Divider />
        <div
          role="group"
          aria-label={dict.unitLabel}
          className="flex items-center gap-1 text-xs/4 font-medium tracking-[1.2px]"
        >
          {UNITS.map(({ value, label }, i) => (
            <Fragment key={value}>
              {i > 0 && <Slash />}
              <button
                type="button"
                aria-pressed={unit === value}
                onClick={() => onUnitChange(value)}
                className={`cursor-pointer ${unit === value ? "" : "text-(--ink-top-2)"}`}
              >
                {label}
              </button>
            </Fragment>
          ))}
        </div>
        <Divider />
        <div
          role="group"
          aria-label={dict.languageLabel}
          className="flex items-center gap-1 text-xs/4 font-medium tracking-[1.2px]"
        >
          {locales.map((other, i) => (
            <Fragment key={other}>
              {i > 0 && <Slash />}
              {other === locale ? (
                <span aria-current="true">{other.toUpperCase()}</span>
              ) : (
                <Link
                  href={placeHref(place, other)}
                  hrefLang={other}
                  onClick={() => setPreferenceCookie(LOCALE_COOKIE, other)}
                  className="text-(--ink-top-2)"
                >
                  {other.toUpperCase()}
                </Link>
              )}
            </Fragment>
          ))}
        </div>
        <Divider />
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label={dict.search.open}
          className="cursor-pointer p-1.5"
        >
          <Icon src="/icons/search-icon.svg" width={13.65} height={13.65} />
        </button>
        <p className="font-display border-(--ink-top)/20 text-[28px]/[34px] tracking-[-0.7px] max-md:hidden md:border-l md:pl-[9px]">
          {dict.brand}
        </p>
      </div>
    </header>
  );
}
