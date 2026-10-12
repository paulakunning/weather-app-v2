import { oklch } from "culori";
import { describe, expect, test } from "vitest";
import { SKY_KEYFRAMES, skyColors, type SkyColors } from "./palette";

function keyframe(altitude: number): SkyColors {
  const match = SKY_KEYFRAMES.find((k) => k.altitude === altitude);
  if (!match) throw new Error(`No keyframe at ${altitude}°`);
  return match.colors;
}

const lightness = (hex: string) => oklch(hex)?.l ?? Number.NaN;
const chroma = (hex: string) => oklch(hex)?.c ?? Number.NaN;
const STOPS = ["top", "mid", "bottom"] as const;

describe("skyColors", () => {
  test("returns the keyframe exactly at its altitude", () => {
    expect(skyColors(4, 0, false)).toEqual(keyframe(4));
  });

  test("clamps below night and above day", () => {
    expect(skyColors(-30, 0, false)).toEqual(keyframe(-18));
    expect(skyColors(60, 0, false)).toEqual(keyframe(25));
  });

  test("interpolates between keyframes", () => {
    const l = lightness(skyColors(-8, 0, false).mid);
    expect(l).toBeGreaterThan(lightness(keyframe(-12).mid));
    expect(l).toBeLessThan(lightness(keyframe(-4).mid));
  });

  test("full cloud cover keeps at most 40% of the chroma", () => {
    const cloudy = skyColors(25, 100, false);
    for (const stop of STOPS) {
      expect(chroma(cloudy[stop])).toBeLessThanOrEqual(
        0.4 * chroma(keyframe(25)[stop]) + 0.001,
      );
    }
  });

  test("is pure", () => {
    expect(skyColors(25, 0, false)).toEqual(skyColors(25, 0, false));
  });

  test("rain darkens the sky", () => {
    expect(lightness(skyColors(25, 50, true).mid)).toBeLessThan(
      lightness(skyColors(25, 50, false).mid),
    );
  });
});
