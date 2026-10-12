export type SunTimes = { day: number; sunrise: number; sunset: number };

export function formatTime(
  unix: number,
  timeZone: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(unix * 1000);
}

export function formatHour(
  unix: number,
  timeZone: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(unix * 1000);
}

export function nearestHourIndex(times: number[], unix: number): number {
  let best = 0;
  times.forEach((time, index) => {
    // Strict < keeps the earlier index on ties.
    if (Math.abs(time - unix) < Math.abs((times[best] ?? 0) - unix)) {
      best = index;
    }
  });
  return best;
}

export function sunTimesFor(sun: SunTimes[], unix: number): SunTimes | null {
  return sun.findLast((entry) => entry.day <= unix) ?? null;
}

export function daylightFraction(unix: number, sun: SunTimes): number | null {
  // Polar night: Open-Meteo returns sunrise === sunset (local midnight).
  if (sun.sunset <= sun.sunrise || unix < sun.sunrise || unix > sun.sunset) {
    return null;
  }
  return (unix - sun.sunrise) / (sun.sunset - sun.sunrise);
}

export type TimelineStatus = "live" | "forecast" | "earlier";

export const LIVE_TOLERANCE_SECONDS = 900;

export function timelineStatus(selected: number, now: number): TimelineStatus {
  if (Math.abs(selected - now) <= LIVE_TOLERANCE_SECONDS) return "live";
  return selected > now ? "forecast" : "earlier";
}
