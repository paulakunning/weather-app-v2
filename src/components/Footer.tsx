import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/en";
import { formatCoordinates } from "@/lib/coordinates";
import { formatTime } from "@/lib/time";
import type { Forecast } from "@/lib/weather/types";

function formatVisibility(meters: number | null, locale: Locale): string {
  if (meters === null) return "—";
  const km = meters / 1000;
  const digits = km < 10 ? 1 : 0;
  const number = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(km);
  return `${number} km`;
}

type FooterProps = { forecast: Forecast; locale: Locale; dict: Dictionary };

export function Footer({ forecast, locale, dict }: FooterProps) {
  const { place, timezone, timezoneAbbreviation, fetchedAt, current } =
    forecast;

  return (
    <footer className="flex flex-col items-center gap-x-6 gap-y-1 px-2 pt-1 text-[10px]/[15px] text-(--ink-bottom-2) md:flex-row md:justify-between">
      <p className="tracking-[0.5px]">
        {dict.footer.updated} {formatTime(fetchedAt, timezone, locale)}{" "}
        {timezoneAbbreviation}
      </p>
      <p className="tracking-[1px] uppercase">
        {place.name} ·{" "}
        {formatCoordinates(place.latitude, place.longitude, dict.hemispheres)}
      </p>
      <p className="tracking-[0.5px]">
        {`${dict.metrics.visibility} ${formatVisibility(current.visibility, locale)}`}
      </p>
    </footer>
  );
}
