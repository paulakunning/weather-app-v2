export type WeatherCondition =
  | "clear"
  | "mainlyClear"
  | "partlyCloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "freezingDrizzle"
  | "rain"
  | "freezingRain"
  | "snow"
  | "snowGrains"
  | "rainShowers"
  | "snowShowers"
  | "thunderstorm"
  | "thunderstormHail"
  | "unknown";

// WMO weather interpretation codes, as returned by Open-Meteo.
const CONDITIONS: Record<number, WeatherCondition> = {
  0: "clear",
  1: "mainlyClear",
  2: "partlyCloudy",
  3: "overcast",
  45: "fog",
  48: "fog",
  51: "drizzle",
  53: "drizzle",
  55: "drizzle",
  56: "freezingDrizzle",
  57: "freezingDrizzle",
  61: "rain",
  63: "rain",
  65: "rain",
  66: "freezingRain",
  67: "freezingRain",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snowGrains",
  80: "rainShowers",
  81: "rainShowers",
  82: "rainShowers",
  85: "snowShowers",
  86: "snowShowers",
  95: "thunderstorm",
  96: "thunderstormHail",
  99: "thunderstormHail",
};

export function conditionFromCode(code: number): WeatherCondition {
  return CONDITIONS[code] ?? "unknown";
}

const RAINY: ReadonlySet<WeatherCondition> = new Set([
  "drizzle",
  "freezingDrizzle",
  "rain",
  "freezingRain",
  "rainShowers",
  "thunderstorm",
  "thunderstormHail",
]);

export function isRainy(condition: WeatherCondition): boolean {
  return RAINY.has(condition);
}
