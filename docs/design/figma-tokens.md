# Figma design tokens

Extracted once from Figma file `s1HvGVKLLg1eQnJxo3ToZa`, node `1:274` ("Html → Body", 1280 × 1024), on 2026-10-12. The free plan allows one `get_design_context` call per month, so this file is the source of truth for the design. The rendered reference is [`main-desktop.png`](main-desktop.png); the SVG exports the app uses are in [`public/icons/`](../../public/icons/) and [`public/sun-arc/`](../../public/sun-arc/).

The design names the app "VENTANA" and has a settings ("Ajustes de telemetría") button. The spec renames the brand to "Weather App" (`dict.brand`, written as is, not uppercase), drops the settings button and adds an EN/ES switch styled like the °C/°F toggle.

## Fonts

| Role      | Family      | Weights used                                             |
| --------- | ----------- | -------------------------------------------------------- |
| Display   | Bodoni Moda | 400                                                      |
| Interface | Manrope     | 300 (Light), 400, 500 (Medium), 600 (SemiBold), 700 (Bold) |

Both are Google Fonts variable fonts.

## Sky (golden hour)

Main gradient, top to bottom (180°):

| Stop | Color     |
| ---- | --------- |
| 0%   | `#0B0F28` |
| 20%  | `#14193A` |
| 40%  | `#2A2347` |
| 62%  | `#573854` |
| 76%  | `#8B4E60` |
| 89%  | `#C66A59` |
| 97%  | `#F1966A` |
| 100% | `#FCA87D` |

Page background under everything: `#0C112E`.

Layers over the gradient (absolute, `inset-0`, `overflow: clip`):

- **Diffuse cloud silhouette**: 1664 × 588.75 px at left −192, top −78.5; `rounded-[1126px]`, `blur(45px)`; vertical gradient `rgba(33,25,61,0.5)` → `rgba(102,62,91,0.3)` at 50% → `rgba(102,62,91,0)`. It lifts the top of the sky to about `#2B2547` in the render.
- **Low warm horizon haze**: 1536 × 353.25 px at right −128, bottom 62.8; `rounded-[944px]`, `blur(40px)`; gradient from the bottom: `rgba(239,140,97,0.25)` → `rgba(159,86,108,0.2)` at 50% → `rgba(159,86,108,0)`.
- **Film grain**: full size, `mix-blend-mode: screen`, opacity 0.04. The export is a flat rectangle, so the grain is drawn with SVG `feTurbulence`.

## Accent colors

| Token          | Value     | Used for                                              |
| -------------- | --------- | ----------------------------------------------------- |
| peach          | `#F7AB82` | Live dot halo, sun halo, ruler needle diamond, glows  |
| peach-light    | `#FFCEB5` | Live dot, degree sign, current-hour labels, needle    |
| peach-pale     | `#FFDBCA` | Sunset label on the arc                               |
| sunrise        | `#FFB68F` | Sunrise hour label and tick on the ruler              |
| sun            | `#FFF5EC` | Sun dot on the arc                                    |

## Layout (1280 px wide)

- Main viewport: `max-width: 1720px`, padding top 28, sides 64, bottom 24; a column of header / center (flex 1, padding-y 16, content centered) / ruler.
- Dividers: 1 × 12 px, `rgba(255,255,255,0.2)`.

## Header

- Left (gap 16): city name + chevron (gap 8) · divider · local time + zone (gap 6, baseline).
  - City: Bodoni Moda 400, 28/34, tracking −0.7px, white.
  - Chevron: 7.96 × 4.51, white at 50% (`public/icons/chevron.svg`).
  - Time: Manrope 500, 12/16, tracking 0.6px, white 90%.
  - Zone ("ART"): Manrope 400, 10/15, tracking 1px, uppercase, white 60%.
- Right (gap 28): status · divider · °C / °F · divider · search button · brand.
  - Status dot: 8 px, `#FFCEB5`, with a `#F7AB82` halo at 75% opacity (pulsing). Label: Manrope 600, 11/14, tracking 1.1px, uppercase, white 70%; gap 8.
  - Unit toggle (gap 4): active "°C" Manrope 500, 12/16, tracking 1.2px, white; "/" Manrope 300, white 30%; inactive "°F" Manrope 500, white 50%.
  - Search button: padding 6, icon 13.65 px, white 70% (`public/icons/search-icon.svg`).
  - Brand: border-left 1px white 20%, padding-left 9; Bodoni Moda 400, 28/34, tracking 2.8px, uppercase, white 95%.

## Sun arc

Container: height 124 (padding-x 128, padding-bottom 12), inner max-width 896, height 112. The arc SVG is 733 px wide in the reference.

- Horizon: dashed line at 85.45% height, stroke white 12%, width 1.02, dash `2.04 6.11` (`public/sun-arc/horizon-dashed.svg`).
- Arc: quadratic curve from horizon to horizon, peak about 61.8 px above (`M0.61 61.19 C231.4 −19.58 462.19 −19.58 692.98 61.19`), stroke width 1.22, round caps; horizontal gradient: white 4% → `#F7AB82` 50% at 0.65 → `#FFDBCA` 85% at 0.82 → white 10% (`public/sun-arc/path.svg`).
- Sunrise marker: 4 px dot, white 35% (`public/sun-arc/sunrise-dot.svg`); label "07:14 ALBA" Manrope 400, 10.18 px, tracking 0.81px, white 45%.
- Sun: 28.5 px halo `#F7AB82` at 18% (`public/sun-arc/sun-halo.svg`) around a 9.16 px dot `#FFF5EC` (`public/sun-arc/sun-dot.svg`); a dotted tick down to the horizon, `#F7AB82` at 70%, dash `1.02 2.04`, 18.3 px (`public/sun-arc/sun-tick.svg`).
- Sunset label "19:58 OCASO": Manrope 500, 11.2 px, tracking 0.56px, `#FFDBCA`.

## Temperature block

- Number: Bodoni Moda 400, 250/250, tracking −12.5px, white, text-shadow `0 0 80px rgba(247,171,130,0.2), 0 0 35px rgba(255,230,215,0.4)`, centered.
- Degree sign: Bodoni Moda 400, 88/88, `#FFCEB5`, opacity 0.95, top-right of the number (top −16, right −56).
- Condition: Manrope 300, 24/28, tracking 0.6px, white 95%.
- "Feels like" line: Manrope 400, 14/22, tracking 0.7px, white 65%; the value in Manrope 500, white 90%. Gap 6 under the condition, padding-top 16 above.

## Metrics row

- Width up to 672 px, centered; border-top 1px white 15%, padding-top 29, padding-x 16; `justify-between`, wraps.
- Each metric (gap 8): label Manrope 400, 10/20, tracking 1px, uppercase, white 50% · value Manrope 500, 14/20, white · unit suffix such as "SE" Manrope 400, 12/16, tracking 1.4px, white 60%.
- Separators "·": Manrope 400, 14/20, white 20%.
- Order: Wind ("18 km/h" + "SE") · Humidity ("72%") · Precipitation ("10%") · Barometer ("1016 hPa").

## 24-hour ruler

- Container max-width 1152, gap 8.
- Header ribbon (padding-x 8, `justify-between`):
  - Left "CRONOLOGÍA DE 24 HORAS": Manrope 400, 11/16.5, tracking 1.1px, uppercase, white 55%.
  - Center: 6 px dot `#F7AB82` + "hora actual 19:42" Manrope 500, 11/16.5, tracking 0.55px, lowercase, `#FFCEB5`.
  - Right "RÍO DE LA PLATA" (country slot): Manrope 400, 11/16.5, tracking 1.1px, uppercase, white 50%.
- Track: padding-top 12, padding-bottom 8, horizontal scroll; tick grid `min-width: 960px`, padding-x 16, `justify-between`.
- Hour mark (22.77 px wide, 56.5 px tall):
  - Temperature on top: Manrope 500, 13/16, tracking 0.26px, white.
  - Tick: 1 × 12 px, white 40%, at top 22.
  - Hour below (top 39): Manrope 400, 11/16.5, tracking 0.55px, white 70%.
  - Opacity fades with distance from the selected time: 0.5 at the far ends, 0.9 next to it.
- Between hours: a 1 × 6 px half tick, white 20%, at top 26.
- Emphasis:
  - Midnight, dawn and the selected hour get a 14 px tick (white 60%, or 50% at dawn) and a SemiBold label.
  - Sunrise hour: temperature, tick and label in `#FFB68F` (tick at 60%).
  - The hour nearest the selection: Manrope 700, `#FFCEB5`, tick 1.5 × 16 px `#FFCEB5`.
- Baseline: 1 px line, white 20%, at top 31 across the whole track.
- Needle (at the selected minute): a 10 px diamond (rotated 45°) `#F7AB82` with glow `0 0 12px rgba(247,171,130,0.9)`, over a 1.5 × 36 px line `#FFCEB5` with glow `0 0 8px rgba(247,171,130,0.8)`; 1.93 px gap between them, starting at top 9.93.

## Footer

Padding-top 4, padding-x 8, `justify-between`; all Manrope 400, 10/15, white 40%:

- Left: "Actualización barométrica: 19:40 UTC-3", tracking 0.5px.
- Center: "BUENOS AIRES · 34.6037° S, 58.3816° O", tracking 1px, uppercase.
- Right: "Visibilidad 10 km", tracking 0.5px.
