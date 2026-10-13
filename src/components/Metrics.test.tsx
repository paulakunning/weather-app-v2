import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { es } from "@/i18n/es";
import type { HourPoint } from "@/lib/weather/types";
import { Metrics } from "./Metrics";

const point: HourPoint = {
  time: 1791835200,
  temperature: 14,
  apparentTemperature: 12,
  humidity: 72,
  precipitationProbability: null,
  precipitation: 0,
  weatherCode: 2,
  cloudCover: 40,
  windSpeed: 18.4,
  windDirection: 135,
  pressure: 1016.2,
  visibility: 10000,
};

it("shows wind, humidity, a missing precipitation and rounded pressure", () => {
  render(<Metrics point={point} dict={es} />);

  expect(screen.getByText("18 km/h")).toBeInTheDocument();
  expect(screen.getByText("SE")).toBeInTheDocument();
  expect(screen.getByText("72%")).toBeInTheDocument();
  expect(screen.getByText("—")).toBeInTheDocument();
  expect(screen.getByText("1016 hPa")).toBeInTheDocument();
  expect(screen.getByText("Barómetro")).toBeInTheDocument();
});
