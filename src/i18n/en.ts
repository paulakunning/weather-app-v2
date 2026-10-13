import type { Hemispheres } from "@/lib/coordinates";
import type { CompassPoint } from "@/lib/units";
import type { WeatherCondition } from "@/lib/weather-codes";

export const en = {
  brand: "Weather App",
  status: {
    live: "LIVE",
    forecast: "FORECAST",
    earlier: "EARLIER",
    backToLive: "Back to now",
  },
  feelsLike: "Feels like",
  metrics: {
    wind: "Wind",
    humidity: "Humidity",
    precipitation: "Precipitation",
    pressure: "Barometer",
    visibility: "Visibility",
  },
  sun: {
    sunrise: "Sunrise",
    sunset: "Sunset",
  },
  timeline: {
    title: "24-hour timeline",
    now: "now",
    label: "Time of day",
  },
  footer: {
    updated: "Updated",
  },
  degrees: "degrees",
  yourLocation: "Your location",
  search: {
    open: "Search city",
    placeholder: "Search city…",
    close: "Close search",
    useMyLocation: "Use my location",
    noResults: "We couldn't find that city",
    unavailable: "Search is unavailable right now",
    locationDenied: "Location permission was denied",
    locationUnavailable: "We couldn't get your location",
  },
  notFound: {
    title: "City not found",
    body: "Try searching for another one.",
  },
  error: {
    title: "We couldn't load the weather",
    retry: "Try again",
  },
  unitLabel: "Temperature unit",
  languageLabel: "Language",
  conditions: {
    clear: "Clear",
    mainlyClear: "Mainly clear",
    partlyCloudy: "Partly cloudy",
    overcast: "Overcast",
    fog: "Fog",
    drizzle: "Drizzle",
    freezingDrizzle: "Freezing drizzle",
    rain: "Rain",
    freezingRain: "Freezing rain",
    snow: "Snow",
    snowGrains: "Snow grains",
    rainShowers: "Rain showers",
    snowShowers: "Snow showers",
    thunderstorm: "Thunderstorm",
    thunderstormHail: "Thunderstorm with hail",
    unknown: "Unknown",
  } satisfies Record<WeatherCondition, string>,
  compass: {
    N: "N",
    NE: "NE",
    E: "E",
    SE: "SE",
    S: "S",
    SW: "SW",
    W: "W",
    NW: "NW",
  } satisfies Record<CompassPoint, string>,
  hemispheres: {
    N: "N",
    S: "S",
    E: "E",
    W: "W",
  } satisfies Hemispheres,
};

export type Dictionary = typeof en;
