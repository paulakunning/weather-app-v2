import { pickInk, type Ink } from "./contrast";
import { skyColors, type SkyColors } from "./palette";

export type SkyTheme = {
  colors: SkyColors;
  ink: { top: Ink; mid: Ink; bottom: Ink };
  cloudOpacity: number;
  rainOpacity: number;
};

export function skyTheme(
  altitude: number,
  cloudCover: number,
  isRaining: boolean,
  rainOpacity = 0,
): SkyTheme {
  const colors = skyColors(altitude, cloudCover, isRaining);
  return {
    colors,
    ink: {
      top: pickInk(colors.top),
      mid: pickInk(colors.mid),
      bottom: pickInk(colors.bottom),
    },
    cloudOpacity: 0.15 + (0.5 * cloudCover) / 100,
    rainOpacity,
  };
}

export function themeToCss({
  colors,
  ink,
  cloudOpacity,
  rainOpacity,
}: SkyTheme): string {
  return (
    `:root{--sky-top:${colors.top};--sky-mid:${colors.mid};--sky-bottom:${colors.bottom};` +
    `--ink-top:${ink.top.primary};--ink-top-2:${ink.top.secondary};` +
    `--ink-mid:${ink.mid.primary};--ink-mid-2:${ink.mid.secondary};` +
    `--ink-bottom:${ink.bottom.primary};--ink-bottom-2:${ink.bottom.secondary};` +
    `--cloud-opacity:${cloudOpacity};--rain-opacity:${rainOpacity}}`
  );
}
