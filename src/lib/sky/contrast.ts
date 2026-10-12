import { interpolate, wcagContrast } from "culori";

export const LIGHT_INK = "#ffffff";
// Near black, not pure indigo: mid-gray skies still reach 4.5:1 against it.
export const DARK_INK = "#050312";
export const MIN_CONTRAST = 4.5;
export const SECONDARY_ALPHA = 0.6;

export type Ink = { primary: string; secondary: string };

function rgbChannels(hex: string): string {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");
}

export function pickInk(background: string): Ink {
  const primary =
    wcagContrast(LIGHT_INK, background) >= wcagContrast(DARK_INK, background)
      ? LIGHT_INK
      : DARK_INK;

  // Same blend the browser does when it paints rgb(… / alpha) over the sky.
  const blend = interpolate([background, primary], "rgb");
  let alpha = SECONDARY_ALPHA;
  while (alpha < 1 && wcagContrast(blend(alpha), background) < MIN_CONTRAST) {
    alpha = Math.min(1, Math.round((alpha + 0.02) * 100) / 100);
  }

  return { primary, secondary: `rgb(${rgbChannels(primary)} / ${alpha})` };
}
