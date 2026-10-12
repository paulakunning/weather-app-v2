export type TemperatureUnit = "c" | "f";

export const UNIT_COOKIE = "unit";

export function parseUnit(value: string | undefined): TemperatureUnit {
  return value === "f" ? "f" : "c";
}

export function toUnit(celsius: number, unit: TemperatureUnit): number {
  const value = unit === "f" ? (celsius * 9) / 5 + 32 : celsius;
  // Math.round(-0.4) is -0, which would render as "-0°".
  return Math.round(value) || 0;
}

export type CompassPoint = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

const COMPASS_POINTS: readonly CompassPoint[] = [
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
];

export function compassPoint(degrees: number): CompassPoint {
  const normalized = ((degrees % 360) + 360) % 360;
  return COMPASS_POINTS[Math.round(normalized / 45) % 8] ?? "N";
}
