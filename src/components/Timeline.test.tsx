import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/i18n/en";
import fixture from "@/lib/weather/__fixtures__/buenos-aires.json";
import { normalizeForecast } from "@/lib/weather/normalize";
import { forecastResponseSchema } from "@/lib/weather/schema";
import { Timeline } from "./Timeline";

const forecast = normalizeForecast(forecastResponseSchema.parse(fixture), {
  id: 3435910,
  name: "Buenos Aires",
  country: "Argentina",
  latitude: -34.61315,
  longitude: -58.37723,
});
const max = forecast.hours.at(-1)?.time ?? 0;

function renderTimeline(value: number) {
  const onChange = vi.fn();
  render(
    <Timeline
      hours={forecast.hours}
      value={value}
      onChange={onChange}
      timeZone={forecast.timezone}
      locale="en"
      unit="c"
      dict={en}
      now={forecast.current.time}
      country={forecast.place.country}
    />,
  );
  return {
    onChange,
    slider: screen.getByRole("slider", { name: "Time of day" }),
  };
}

describe("Timeline", () => {
  it("moves one hour with the arrow keys", () => {
    const { onChange, slider } = renderTimeline(forecast.current.time);
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(forecast.current.time + 3600);
  });

  it("stops at the end of the window", () => {
    const { onChange, slider } = renderTimeline(max);
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(max);
  });

  it("announces the time and temperature", () => {
    const { slider } = renderTimeline(forecast.current.time);
    expect(slider.getAttribute("aria-valuetext")).toMatch(
      /^\d{2}:\d{2}, \d+ degrees$/,
    );
  });
});
