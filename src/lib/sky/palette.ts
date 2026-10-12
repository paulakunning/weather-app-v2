import { formatHex, interpolate } from "culori";

export type SkyColors = { top: string; mid: string; bottom: string };

export const SKY_KEYFRAMES: readonly { altitude: number; colors: SkyColors }[] =
  [
    // Night
    {
      altitude: -18,
      colors: { top: "#05060f", mid: "#0b1026", bottom: "#151a3a" },
    },
    // Nautical twilight
    {
      altitude: -12,
      colors: { top: "#0b1030", mid: "#1c1f4a", bottom: "#3a2f5e" },
    },
    // Civil twilight
    {
      altitude: -4,
      colors: { top: "#1d1b4a", mid: "#4a3a6e", bottom: "#c0708a" },
    },
    // Golden hour (recalibrated from Figma in Task 6.1)
    {
      altitude: 4,
      colors: { top: "#211b3b", mid: "#4b3555", bottom: "#f4a27a" },
    },
    // Day
    {
      altitude: 25,
      colors: { top: "#2f6fb8", mid: "#6aa7dc", bottom: "#bfe0f5" },
    },
  ];

export function skyColors(
  altitude: number,
  cloudCover: number,
  isRaining: boolean,
): SkyColors {
  // Outside the keyframe range only one side exists, which clamps the altitude.
  const below = SKY_KEYFRAMES.findLast((k) => k.altitude <= altitude);
  const above = SKY_KEYFRAMES.find((k) => k.altitude >= altitude);
  const from = below ?? above;
  const to = above ?? below;
  if (!from || !to) throw new Error("SKY_KEYFRAMES is empty");
  const span = to.altitude - from.altitude;
  const t = span === 0 ? 0 : (altitude - from.altitude) / span;

  const chromaFactor = (1 - (0.6 * cloudCover) / 100) * (isRaining ? 0.7 : 1);
  const lightnessFactor = isRaining ? 0.85 : 1;

  const mix = (stop: keyof SkyColors) => {
    const color = interpolate([from.colors[stop], to.colors[stop]], "oklch")(t);
    return formatHex({
      ...color,
      l: color.l * lightnessFactor,
      c: color.c * chromaFactor,
    });
  };

  return { top: mix("top"), mid: mix("mid"), bottom: mix("bottom") };
}
