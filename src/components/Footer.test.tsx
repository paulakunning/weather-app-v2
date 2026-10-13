import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import fixture from "@/lib/weather/__fixtures__/buenos-aires.json";
import { normalizeForecast } from "@/lib/weather/normalize";
import { forecastResponseSchema } from "@/lib/weather/schema";
import { Footer } from "./Footer";

function forecastWithVisibility(visibility: number | null) {
  const forecast = normalizeForecast(forecastResponseSchema.parse(fixture), {
    id: 3435910,
    name: "Buenos Aires",
    latitude: -34.61315,
    longitude: -58.37723,
  });
  return { ...forecast, current: { ...forecast.current, visibility } };
}

it("shows visibility with one decimal under 10 km, in the locale's format", () => {
  render(
    <Footer forecast={forecastWithVisibility(8540)} locale="es" dict={es} />,
  );
  expect(screen.getByText("Visibilidad 8,5 km")).toBeInTheDocument();
  expect(screen.getByText(/34\.6132° S, 58\.3772° O/)).toBeInTheDocument();
});

it("rounds visibility from 10 km and shows a dash when it is missing", () => {
  const { rerender } = render(
    <Footer forecast={forecastWithVisibility(46360)} locale="en" dict={en} />,
  );
  expect(screen.getByText("Visibility 46 km")).toBeInTheDocument();

  rerender(
    <Footer forecast={forecastWithVisibility(null)} locale="en" dict={en} />,
  );
  expect(screen.getByText("Visibility —")).toBeInTheDocument();
});

it("credits Open-Meteo, the source of the data", () => {
  render(
    <Footer forecast={forecastWithVisibility(10000)} locale="es" dict={es} />,
  );
  expect(screen.getByRole("link", { name: "Open-Meteo" })).toHaveAttribute(
    "href",
    "https://open-meteo.com/",
  );
  expect(screen.getByText(/Datos:/)).toBeInTheDocument();
});
