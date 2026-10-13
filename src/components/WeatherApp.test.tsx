import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/i18n/en";
import fixture from "@/lib/weather/__fixtures__/buenos-aires.json";
import { normalizeForecast } from "@/lib/weather/normalize";
import { forecastResponseSchema } from "@/lib/weather/schema";
import { WeatherApp } from "./WeatherApp";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const forecast = normalizeForecast(forecastResponseSchema.parse(fixture), {
  id: 3435910,
  name: "Buenos Aires",
  latitude: -34.61315,
  longitude: -58.37723,
});

function renderApp() {
  render(
    <>
      <input aria-label="Another field" />
      <WeatherApp forecast={forecast} initialUnit="c" locale="en" dict={en} />
    </>,
  );
}

describe("WeatherApp search", () => {
  it("opens from the city name", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: /Buenos Aires/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens with the / key, unless typing in a field", () => {
    renderApp();
    fireEvent.keyDown(screen.getByLabelText("Another field"), { key: "/" });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.keyDown(document.body, { key: "/" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens with the / key while the ruler has focus", () => {
    renderApp();
    fireEvent.keyDown(screen.getByRole("slider"), { key: "/" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("WeatherApp timeline", () => {
  it("leaves LIVE when the ruler moves and comes back from the status button", () => {
    renderApp();
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    const status = screen.getByRole("button", { name: "FORECAST" });

    fireEvent.click(status);
    expect(screen.getByRole("button", { name: "LIVE" })).toBeDisabled();
  });
});
