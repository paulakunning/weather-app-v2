import { expect, test } from "vitest";
import { skyTheme, themeToCss } from "./theme";

test("themeToCss writes every CSS variable", () => {
  const css = themeToCss(skyTheme(10, 50, false));
  const names = [
    "--sky-top",
    "--sky-mid",
    "--sky-bottom",
    "--ink-top",
    "--ink-top-2",
    "--ink-mid",
    "--ink-mid-2",
    "--ink-bottom",
    "--ink-bottom-2",
    "--cloud-opacity",
    "--rain-opacity",
  ];
  for (const name of names) expect(css).toContain(`${name}:`);
  expect(css).not.toContain("undefined");
  expect(css).toMatch(/^:root\{.*\}$/);
});

test("cloud opacity grows from 0.15 to 0.65 with cloud cover", () => {
  expect(skyTheme(10, 0, false).cloudOpacity).toBeCloseTo(0.15);
  expect(skyTheme(10, 50, false).cloudOpacity).toBeCloseTo(0.4);
  expect(skyTheme(10, 100, false).cloudOpacity).toBeCloseTo(0.65);
});

test("rain opacity is 0 unless given", () => {
  expect(skyTheme(10, 50, false).rainOpacity).toBe(0);
  expect(skyTheme(10, 50, true, 0.5).rainOpacity).toBe(0.5);
});
