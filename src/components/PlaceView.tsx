import { cookies } from "next/headers";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseUnit, UNIT_COOKIE } from "@/lib/units";
import { getForecast } from "@/lib/weather/get-forecast";
import type { Place } from "@/lib/weather/types";
import { WeatherApp } from "./WeatherApp";

export async function PlaceView({
  place,
  locale,
}: {
  place: Place;
  locale: Locale;
}) {
  const [forecast, cookieStore] = await Promise.all([
    getForecast(place),
    cookies(),
  ]);

  return (
    <WeatherApp
      forecast={forecast}
      initialUnit={parseUnit(cookieStore.get(UNIT_COOKIE)?.value)}
      locale={locale}
      dict={getDictionary(locale)}
    />
  );
}
