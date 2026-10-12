import { formatHex, interpolate, parse, wcagContrast } from "culori";
import { expect, test } from "vitest";
import { DARK_INK, LIGHT_INK, MIN_CONTRAST, pickInk } from "./contrast";
import { SKY_KEYFRAMES } from "./palette";

// #000000, #101010 … #f0f0f0, #ffffff
const grays = Array.from({ length: 17 }, (_, i) => {
  const channel = Math.min(i * 16, 255)
    .toString(16)
    .padStart(2, "0");
  return `#${channel}${channel}${channel}`;
});
const keyframeColors = SKY_KEYFRAMES.flatMap(({ colors }) => [
  colors.top,
  colors.mid,
  colors.bottom,
]);

test.each([...grays, ...keyframeColors])(
  "primary and secondary ink reach 4.5:1 on %s",
  (background) => {
    const ink = pickInk(background);
    expect(wcagContrast(ink.primary, background)).toBeGreaterThanOrEqual(
      MIN_CONTRAST,
    );

    const secondary = parse(ink.secondary);
    if (secondary?.alpha === undefined) {
      throw new Error(`Secondary ink has no alpha: ${ink.secondary}`);
    }
    expect(formatHex(secondary)).toBe(ink.primary);
    const blended = interpolate(
      [background, ink.primary],
      "rgb",
    )(secondary.alpha);
    expect(wcagContrast(blended, background)).toBeGreaterThanOrEqual(
      MIN_CONTRAST,
    );
  },
);

test("pickInk chooses white on dark skies and near-black on light ones", () => {
  expect(pickInk("#211b3b").primary).toBe(LIGHT_INK);
  expect(pickInk("#bfe0f5").primary).toBe(DARK_INK);
});

test("secondary ink starts at 60% opacity when that is enough", () => {
  expect(pickInk("#000000").secondary).toBe("rgb(255 255 255 / 0.6)");
});
