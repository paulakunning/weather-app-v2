import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/i18n/en";
import type { TimelineStatus } from "@/lib/time";
import fixture from "@/lib/weather/__fixtures__/buenos-aires.json";
import { normalizeForecast } from "@/lib/weather/normalize";
import { forecastResponseSchema } from "@/lib/weather/schema";
import { Header } from "./Header";

const london = {
  id: 2643743,
  name: "London",
  latitude: 51.50853,
  longitude: -0.12574,
};
const forecast = normalizeForecast(
  forecastResponseSchema.parse(fixture),
  london,
);

function renderHeader(status: TimelineStatus = "live") {
  const onUnitChange = vi.fn();
  render(
    <Header
      place={london}
      forecast={forecast}
      status={status}
      unit="c"
      onUnitChange={onUnitChange}
      locale="en"
      dict={en}
      onOpenSearch={vi.fn()}
      onBackToLive={vi.fn()}
    />,
  );
  return { onUnitChange };
}

describe("Header", () => {
  it("switches to Fahrenheit", async () => {
    const { onUnitChange } = renderHeader();
    await userEvent.click(screen.getByRole("button", { name: "°F" }));
    expect(onUnitChange).toHaveBeenCalledWith("f");
  });

  it("links to the same place in the other language", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: "ES" })).toHaveAttribute(
      "href",
      "/es/london-2643743",
    );
  });

  it("only enables the status button away from now", () => {
    renderHeader("live");
    expect(screen.getByRole("button", { name: "LIVE" })).toBeDisabled();
  });

  it("enables the status button when showing the forecast", () => {
    renderHeader("forecast");
    expect(screen.getByRole("button", { name: /FORECAST/ })).toBeEnabled();
  });
});
