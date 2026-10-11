# Ventana v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Ventana v1, a bilingual weather web app where the screen is the city's live sky, with a 24-hour ruler to travel through the day.

**Architecture:** Next.js 16 App Router. Server Components fetch and validate Open-Meteo data (cached) and render a single Client Component (`Ventana`) that owns one piece of state, the selected time. Everything visual (sky colors, ink colors, metrics) is derived from the data plus that time by pure, unit-tested functions in `src/lib`.

**Tech Stack:** Next.js 16.4, React 19.3, TypeScript 5 (strict), Tailwind CSS 4, Motion 14, Zod 4, suncalc 2, culori 4, Vitest 5 + Testing Library + jsdom, Playwright 1.64, ESLint + Prettier, GitHub Actions, Vercel.

**Spec:** [`docs/spec.md`](spec.md)

## Global Constraints

- Node 24, npm 11. Versions are pinned at install (`npm install --save-exact`).
- TypeScript `strict: true` and `noUncheckedIndexedAccess: true`; no `any`, no `@ts-ignore`.
- Code identifiers, file names, UI copy and docs in English. Chat explanations in Spanish.
- Locales: `en` (default) and `es`. Every user-facing string comes from a dictionary; `es` is typed as `Dictionary` (= `typeof en`), so a missing key fails `npm run typecheck`.
- Times are always 24-hour (`hourCycle: 'h23'`) in both locales, formatted in the city's time zone.
- Modules under `src/lib/weather/` and `src/lib/geocoding/` start with `import 'server-only'`.
- Caching: forecast `fetch(..., { next: { revalidate: 600 } })`; geocoding `revalidate: 86400`. Cache Components stay disabled.
- Default place: Open-Meteo id `3435910` (Buenos Aires).
- Forecast query (exact): `timezone=auto&timeformat=unixtime&past_hours=3&forecast_hours=21&past_days=1&forecast_days=2&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,pressure_msl,precipitation&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,pressure_msl,visibility&daily=sunrise,sunset`. It returns 24 hourly points (current hour at index 3) and 3 days of sun times (yesterday, today, tomorrow).
- Contrast: every text ink meets 4.5:1 against the sky color behind it (primary and secondary).
- Motion: sky 600 ms, temperature number 300 ms, search 250 ms; all instant under `prefers-reduced-motion`.
- Naming: components `PascalCase.tsx`; other modules `kebab-case.ts`; tests next to source as `*.test.ts(x)`; booleans `is`/`has`.

## Workflow per block (overrides the default "Commit" step)

Each block is one branch. The last step of every block is **"Close the block"**:
1. Run `npm run lint && npm run typecheck && npm test` (plus `npm run test:e2e` once it exists). Everything passes.
2. `git add -A`. Do **not** commit.
3. Explain the block in chat (Spanish): key decisions, TypeScript notes vs plain JS, server-side notes. Then a 3–5 question multiple-choice quiz (AskUserQuestion); explain wrong answers.
4. The owner reviews `git diff --staged`. Apply requested changes.
5. Propose the atomic commits (Conventional Commits message + files each) and wait for the OK. Commit, push, open the PR (what / why / how to test; no tool attribution).
6. CI green → ask for the OK → merge to `main` with a merge commit (`gh pr merge --merge`) → announce the merge.

The "Suggested commits" line in each block is the starting proposal for step 5.

## Review Focus

1. **Temperatures between −0.5 and 0 °C** must render "0°", never "-0°". Test in Task 2.1.
2. **Typing fast in the search** must never show results for an older query (responses arriving out of order). Test in Task 8.1.
3. **City names with no Latin letters** (e.g. "北京") must still produce a working URL. Test in Task 2.2.
4. **Mid-gray skies** (overcast midday) must still give readable text: the dark ink must be close to black for that. Test in Task 3.2.
5. **Moments just after local midnight** (window starts the previous day) must find that day's sunrise/sunset. Test in Task 2.3.

---

## Block 1 — `chore/project-setup`

### Task 1.1: Scaffold and strict TypeScript

**Files:** Create the Next.js app in the repo root (keeps `docs/`). Modify: `tsconfig.json`, `package.json`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`. Create: `.nvmrc` (`24`).

- [ ] **Step 1:** In a scratch dir run `npx create-next-app@16.4.0 ventana --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --react-compiler --use-npm --disable-git --no-agent-feedback`, then copy everything except `node_modules` into the repo root and run `npm install` there. (The repo is not empty, so scaffold outside it.)
- [ ] **Step 2:** In `tsconfig.json` set `"strict": true` and add `"noUncheckedIndexedAccess": true`.
- [ ] **Step 3:** Replace the boilerplate home page with `<main>Ventana</main>`, empty `globals.css` down to `@import "tailwindcss";`, and delete unused files in `public/`.
- [ ] **Step 4:** Add the script `"typecheck": "tsc --noEmit"`. Run `npm run lint && npm run typecheck && npm run build`. Expected: all succeed.

### Task 1.2: Formatting and test tooling

**Files:** Create: `.prettierrc.json`, `.prettierignore`, `vitest.config.mts`, `vitest.setup.ts`, `src/test/server-only-stub.ts`, `playwright.config.ts`, `e2e/.gitkeep`, `src/lib/sanity.test.ts` (deleted in Block 2). Modify: `eslint.config.mjs`, `package.json`.

- [ ] **Step 1:** Install dev deps: `prettier eslint-config-prettier vitest @vitejs/plugin-react vite-tsconfig-paths jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @playwright/test`. Add `eslint-config-prettier` as the last ESLint config entry.
- [ ] **Step 2:** `vitest.config.mts`: plugins `tsconfigPaths()` and `react()`, `environment: 'jsdom'`, `setupFiles: ['./vitest.setup.ts']` (imports `@testing-library/jest-dom/vitest`), `include: ['src/**/*.test.{ts,tsx}']`, alias `server-only` → `src/test/server-only-stub.ts` (empty `export {}`).
- [ ] **Step 3:** `playwright.config.ts`: `testDir: 'e2e'`, Chromium only, `webServer: { command: 'npm run build && npm run start', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI }`.
- [ ] **Step 4:** Scripts: `test` = `vitest run`, `test:watch` = `vitest`, `test:e2e` = `playwright test`, `format` = `prettier --write .`, `format:check` = `prettier --check .`.
- [ ] **Step 5:** Write `src/lib/sanity.test.ts` with `expect(1 + 1).toBe(2)`. Run `npm test`. Expected: 1 passed. Run `npm run format:check`. Expected: passes after one `npm run format`.

### Task 1.3: CI

**Files:** Create: `.github/workflows/ci.yml`.

- [ ] **Step 1:** Workflow on `pull_request` and `push` to `main`. Job `checks` (ubuntu-latest, `actions/setup-node` with `node-version-file: .nvmrc`, `cache: npm`): `npm ci` → `npm run lint` → `npm run format:check` → `npm run typecheck` → `npm test` → `npm run build`. (An `e2e` job is added in Task 5.4.)
- [ ] **Step 2:** Close the block. Suggested commits: `chore: scaffold Next.js 16 app with strict TypeScript` · `chore: add Prettier, Vitest and Playwright tooling` · `ci: add lint, typecheck, test and build workflow`.

---

## Block 2 — `feat/domain-utils`

All pure functions, built test-first (write test → see it fail → implement → see it pass).

### Task 2.1: Units and compass

**Files:** Create: `src/lib/units.ts`, `src/lib/units.test.ts`. Delete: `src/lib/sanity.test.ts`.

**Interfaces — Produces:**
- `type TemperatureUnit = 'c' | 'f'`
- `UNIT_COOKIE = 'unit'`
- `parseUnit(value: string | undefined): TemperatureUnit` — `'f'` only for `'f'`, else `'c'`.
- `toUnit(celsius: number, unit: TemperatureUnit): number` — rounded integer, never `-0`.
- `type CompassPoint = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'`
- `compassPoint(degrees: number): CompassPoint` — 8 sectors of 45°, centered (N = 337.5–22.5).

- [ ] **Step 1: Tests:** `toUnit(14, 'c') === 14`; `toUnit(14, 'f') === 57`; `toUnit(-0.4, 'c')` is `0` and `Object.is(result, -0) === false`; `toUnit(-40, 'f') === -40`; `parseUnit('f') === 'f'`, `parseUnit('x') === 'c'`, `parseUnit(undefined) === 'c'`; `compassPoint(0) === 'N'`, `(22.4) 'N'`, `(22.5) 'NE'`, `(169) 'S'`, `(350) 'N'`, `(360) 'N'`, `(-45) 'NW'`.
- [ ] **Step 2:** Run `npm test -- units` → FAIL (module not found). Implement. Run again → PASS.

### Task 2.2: Slugs and coordinates

**Files:** Create: `src/lib/slug.ts`, `src/lib/slug.test.ts`, `src/lib/coordinates.ts`, `src/lib/coordinates.test.ts`.

**Interfaces — Produces:**
- `slugify(name: string): string` — NFD, strip diacritics, lowercase, runs of non `[a-z0-9]` → `-`, trim `-`.
- `placePath(name: string, id: number): string` → `` `${slugify(name) || 'city'}-${id}` ``.
- `parsePlaceParam(param: string): { slug: string; id: number } | null` — matches `^(?:(.*)-)?(\d+)$`; id must be a positive safe integer.
- `parseCoordinates(lat: string | undefined, lon: string | undefined): { latitude: number; longitude: number } | null` — both finite numbers via `Number()`, non-empty after trim, lat ∈ [−90, 90], lon ∈ [−180, 180].
- `type Hemispheres = { N: string; S: string; E: string; W: string }`
- `formatCoordinates(latitude: number, longitude: number, hemispheres: Hemispheres): string` → 4 decimals, absolute values, e.g. `"34.6132° S, 58.3772° W"`.

- [ ] **Step 1: Tests:** `slugify('Córdoba') === 'cordoba'`; `slugify('São Paulo') === 'sao-paulo'`; `slugify('  Buenos   Aires ') === 'buenos-aires'`; `placePath('北京', 1816670) === 'city-1816670'`; `parsePlaceParam('buenos-aires-3435910')` → `{ slug: 'buenos-aires', id: 3435910 }`; `parsePlaceParam('3435910')` → `{ slug: '', id: 3435910 }`; `parsePlaceParam('buenos-aires')`, `('x-0')`, `('')` → `null`. `parseCoordinates('-34.6', '-58.38')` → numbers; `('91', '0')`, `('0', '181')`, `('abc', '0')`, `(' ', '0')`, `(undefined, '0')` → `null`. `formatCoordinates(-34.61315, -58.37723, { N:'N', S:'S', E:'E', W:'O' }) === '34.6132° S, 58.3772° O'`.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.

### Task 2.3: Time helpers

**Files:** Create: `src/lib/time.ts`, `src/lib/time.test.ts`.

**Interfaces — Produces:**
- `type SunTimes = { day: number; sunrise: number; sunset: number }` (all unix seconds; `day` = local midnight, as Open-Meteo's `daily.time`).
- `formatTime(unix: number, timeZone: string, locale: string): string` → `"19:42"`.
- `formatHour(unix: number, timeZone: string, locale: string): string` → `"16"`.
- `nearestHourIndex(times: number[], unix: number): number` — closest; ties go to the earlier one; clamps to the ends.
- `sunTimesFor(sun: SunTimes[], unix: number): SunTimes | null` — last entry with `day <= unix`, `null` if none.
- `daylightFraction(unix: number, sun: SunTimes): number | null` — `(unix − sunrise) / (sunset − sunrise)` when between, else `null`.
- `type TimelineStatus = 'live' | 'forecast' | 'earlier'`
- `LIVE_TOLERANCE_SECONDS = 900`
- `timelineStatus(selected: number, now: number): TimelineStatus` — `live` if `|selected − now| <= 900`.

- [ ] **Step 1: Tests** (Buenos Aires fixture values): `formatTime(1791691200 + 42*60, 'America/Argentina/Buenos_Aires', 'en')` equals the same as for `'es'` and matches `/^\d{2}:\d{2}$/`; `formatHour(1791680400, 'America/Argentina/Buenos_Aires', 'en') === '16'`. `nearestHourIndex([0, 3600, 7200], 1800) === 0`, `(…, 1801) === 1`, `(…, -500) === 0`, `(…, 99999) === 2`. With `sun = [{ day: 1791601200, sunrise: 1791623877, sunset: 1791669829 }, { day: 1791687600, sunrise: 1791710199, sunset: 1791756278 }]`: `sunTimesFor(sun, 1791687600 - 3600)` is the first entry (previous day, 23:00); `sunTimesFor(sun, 1791687600)` is the second; `sunTimesFor(sun, 0) === null`. `daylightFraction(1791710199, sun[1]) === 0`; mid-day → `0.5`; `1791756278 + 1` → `null`. `timelineStatus(1000, 1000 + 900) === 'live'`, `(1000 + 901, 1000) === 'forecast'`, `(1000 - 901, 1000) === 'earlier'`.
- [ ] **Step 2:** Run → FAIL. Implement with `Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })`. Run → PASS.

### Task 2.4: Weather codes, i18n config and dictionaries

**Files:** Create: `src/lib/weather-codes.ts`, `src/lib/weather-codes.test.ts`, `src/i18n/config.ts`, `src/i18n/config.test.ts`, `src/i18n/en.ts`, `src/i18n/es.ts`, `src/i18n/get-dictionary.ts`.

**Interfaces — Produces:**
- `type WeatherCondition = 'clear' | 'mainlyClear' | 'partlyCloudy' | 'overcast' | 'fog' | 'drizzle' | 'freezingDrizzle' | 'rain' | 'freezingRain' | 'snow' | 'snowGrains' | 'rainShowers' | 'snowShowers' | 'thunderstorm' | 'thunderstormHail' | 'unknown'`
- `conditionFromCode(code: number): WeatherCondition` — WMO: 0 clear · 1 mainlyClear · 2 partlyCloudy · 3 overcast · 45, 48 fog · 51, 53, 55 drizzle · 56, 57 freezingDrizzle · 61, 63, 65 rain · 66, 67 freezingRain · 71, 73, 75 snow · 77 snowGrains · 80, 81, 82 rainShowers · 85, 86 snowShowers · 95 thunderstorm · 96, 99 thunderstormHail · anything else unknown.
- `isRainy(condition: WeatherCondition): boolean` — true for drizzle, freezingDrizzle, rain, freezingRain, rainShowers, thunderstorm, thunderstormHail.
- `locales = ['en', 'es'] as const`; `type Locale = (typeof locales)[number]`; `defaultLocale: Locale = 'en'`; `LOCALE_COOKIE = 'NEXT_LOCALE'`.
- `isLocale(value: string | undefined): value is Locale` (type guard).
- `matchLocale(acceptLanguage: string | null, cookieValue: string | undefined): Locale` — valid cookie wins; else parse `Accept-Language` entries `tag;q=x` (default q 1, q 0 excluded), sort by q descending (stable), take the first whose primary subtag (`es-AR` → `es`) is a locale; else `defaultLocale`.
- `export const en = { … }` and `export type Dictionary = typeof en`; `export const es: Dictionary = { … }`.
- `getDictionary(locale: Locale): Dictionary`.

Dictionary keys and copy (EN / ES):

| Key | en | es |
|---|---|---|
| `brand` | VENTANA | VENTANA |
| `status.live` / `.forecast` / `.earlier` | LIVE / FORECAST / EARLIER | EN VIVO / PRONÓSTICO / MÁS TEMPRANO |
| `status.backToLive` (aria) | Back to now | Volver al ahora |
| `feelsLike` | Feels like | Sensación térmica |
| `metrics.wind` / `.humidity` / `.precipitation` / `.pressure` / `.visibility` | Wind / Humidity / Precipitation / Barometer / Visibility | Viento / Humedad / Precipitación / Barómetro / Visibilidad |
| `sun.sunrise` / `.sunset` | Sunrise / Sunset | Alba / Ocaso |
| `timeline.title` / `.now` / `.label` | 24-hour timeline / now / Time of day | Cronología de 24 horas / hora actual / Hora del día |
| `footer.updated` | Updated | Actualización |
| `degrees` | degrees | grados |
| `yourLocation` | Your location | Tu ubicación |
| `search.open` / `.placeholder` / `.close` | Search city / Search city… / Close search | Buscar ciudad / Buscar ciudad… / Cerrar búsqueda |
| `search.useMyLocation` | Use my location | Usar mi ubicación |
| `search.noResults` / `.unavailable` | We couldn't find that city / Search is unavailable right now | No encontramos esa ciudad / No pudimos buscar ahora |
| `search.locationDenied` / `.locationUnavailable` | Location permission was denied / We couldn't get your location | Se denegó el permiso de ubicación / No pudimos obtener tu ubicación |
| `notFound.title` / `.body` | City not found / Try searching for another one. | Ciudad no encontrada / Probá buscar otra. |
| `error.title` / `.retry` | We couldn't load the weather / Try again | No pudimos cargar el clima / Reintentar |
| `unitLabel` / `languageLabel` (aria) | Temperature unit / Language | Unidad de temperatura / Idioma |
| `conditions` | `Record<WeatherCondition, string>`, standard wording, e.g. partlyCloudy "Partly cloudy" | e.g. "Parcialmente nublado" |
| `compass` | `Record<CompassPoint, string>`: N NE E SE S SW W NW | N NE E SE S SO O NO |
| `hemispheres` | N S E W | N S E O |

- [ ] **Step 1: Tests:** `conditionFromCode(2) === 'partlyCloudy'`, `(99) 'thunderstormHail'`, `(42) 'unknown'`; `isRainy('rainShowers') === true`, `isRainy('snow') === false`. `matchLocale('es-AR,es;q=0.9,en;q=0.8', undefined) === 'es'`; `('en-US,en;q=0.9,es;q=0.8', undefined) === 'en'`; `('fr-FR,fr;q=0.9', undefined) === 'en'`; `('fr;q=0.9, es;q=0.8', undefined) === 'es'`; `('es;q=0', undefined) === 'en'`; `(null, undefined) === 'en'`; `('*', undefined) === 'en'`; `('en', 'es') === 'es'`; `('es', 'fr') === 'es'` (invalid cookie ignored). `isLocale('es') === true`, `isLocale('fr') === false`.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS. Run `npm run typecheck` → PASS (proves `es` has every key).
- [ ] **Step 3:** Close the block. Suggested commits: `feat(units): add temperature conversion and compass points` · `feat(lib): add slug and coordinate helpers` · `feat(time): add time-zone aware time helpers` · `feat(i18n): add locales, dictionaries and weather conditions`.

---

## Block 3 — `feat/sky-engine`

### Task 3.1: Sun altitude and sky palette

**Files:** Create: `src/lib/sky/sun.ts`, `src/lib/sky/sun.test.ts`, `src/lib/sky/palette.ts`, `src/lib/sky/palette.test.ts`. Install: `suncalc culori` (+ `@types/suncalc @types/culori` as dev deps if the packages ship no types).

**Interfaces — Produces:**
- `sunAltitude(unix: number, latitude: number, longitude: number): number` — degrees (`suncalc.getPosition(...).altitude * 180 / Math.PI`).
- `type SkyColors = { top: string; mid: string; bottom: string }` — hex `#rrggbb`.
- `SKY_KEYFRAMES: readonly { altitude: number; colors: SkyColors }[]`, ascending:
  - −18 night `#05060f / #0b1026 / #151a3a`
  - −12 nautical `#0b1030 / #1c1f4a / #3a2f5e`
  - −4 civil `#1d1b4a / #4a3a6e / #c0708a`
  - +4 golden `#211b3b / #4b3555 / #f4a27a` (recalibrated from Figma in Task 6.1)
  - +25 day `#2f6fb8 / #6aa7dc / #bfe0f5`
- `skyColors(altitude: number, cloudCover: number, isRaining: boolean): SkyColors`:
  1. Clamp altitude to [−18, 25]; find the surrounding keyframes; `t = (alt − a0) / (a1 − a0)`.
  2. Each stop: `culori.interpolate([c0, c1], 'oklch')(t)`.
  3. Clouds: chroma × `(1 − 0.6 × cloudCover / 100)`.
  4. Rain: chroma × 0.7 and lightness × 0.85.
  5. `culori.formatHex`.

- [ ] **Step 1: Tests:** `sunAltitude(Date.UTC(2026, 9, 11, 15, 40) / 1000, -34.61, -58.38) > 55`; same day at 03:00 UTC `< -40`. `skyColors(4, 0, false)` equals the golden keyframe exactly; `skyColors(-30, 0, false)` equals night; `skyColors(60, 0, false)` equals day; for `skyColors(-8, 0, false).mid`, OKLCH lightness lies strictly between nautical.mid and civil.mid; `skyColors(25, 100, false)` has chroma ≤ 0.4 × day chroma + 0.001 per stop; `skyColors(25, 0, false)` equals `skyColors(25, 0, false)` (pure); `skyColors(25, 50, true).mid` is darker (OKLCH l) than `skyColors(25, 50, false).mid`.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.

### Task 3.2: Automatic contrast and theme

**Files:** Create: `src/lib/sky/contrast.ts`, `src/lib/sky/contrast.test.ts`, `src/lib/sky/theme.ts`, `src/lib/sky/theme.test.ts`.

**Interfaces — Produces:**
- `LIGHT_INK = '#ffffff'`, `DARK_INK = '#050312'` (near black so mid-gray backgrounds still reach 4.5:1), `MIN_CONTRAST = 4.5`, `SECONDARY_ALPHA = 0.6`.
- `type Ink = { primary: string; secondary: string }` — `primary` hex; `secondary` is `rgb(r g b / a)`.
- `pickInk(background: string): Ink` — primary = whichever of LIGHT/DARK has the higher `culori.wcagContrast` with the background. Secondary alpha starts at `SECONDARY_ALPHA` and rises in 0.02 steps (max 1) until the ink blended over the background (`culori.interpolate([background, primary], 'rgb')(alpha)`) reaches `MIN_CONTRAST`.
- `type SkyTheme = { colors: SkyColors; ink: { top: Ink; mid: Ink; bottom: Ink }; cloudOpacity: number }` — `cloudOpacity = 0.15 + 0.5 × cloudCover / 100`.
- `skyTheme(altitude: number, cloudCover: number, isRaining: boolean): SkyTheme`.
- `themeToCss(theme: SkyTheme): string` → `":root{--sky-top:#…;--sky-mid:#…;--sky-bottom:#…;--ink-top:#…;--ink-top-2:rgb(…);--ink-mid:…;--ink-mid-2:…;--ink-bottom:…;--ink-bottom-2:…;--cloud-opacity:0.4}"`.

- [ ] **Step 1: Tests:** for every gray `#000000` → `#ffffff` in 17 steps (`#000000, #101010 … #ffffff`) and every keyframe color: `wcagContrast(ink.primary, bg) >= 4.5` and the blended secondary `>= 4.5`. `pickInk('#211b3b').primary === '#ffffff'`; `pickInk('#bfe0f5').primary === '#050312'`. `themeToCss(...)` contains all 10 variable names and no `undefined`.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 3:** Close the block. Suggested commits: `feat(sky): compute sky palette from sun altitude, clouds and rain` · `feat(sky): pick accessible ink colors for each sky zone`.

---

## Block 4 — `feat/data-layer`

### Task 4.1: Forecast schema, types and normalization

**Files:** Create: `src/lib/weather/types.ts`, `src/lib/weather/schema.ts`, `src/lib/weather/normalize.ts`, `src/lib/weather/normalize.test.ts`, `src/lib/weather/__fixtures__/buenos-aires.json` (a real response with the exact query from Global Constraints), `src/lib/errors.ts`. Install: `zod server-only`.

**Interfaces — Produces:**
- `type Place = { id: number | null; name: string; region?: string; country?: string; latitude: number; longitude: number }`.
- `type HourPoint` as in spec §5, except `precipitationProbability: number | null` and `visibility: number | null`. Open-Meteo returns `null` for these on some models; the UI shows "—".
- `type Forecast = { place: Place; timezone: string; timezoneAbbreviation: string; current: HourPoint; hours: HourPoint[]; sun: SunTimes[]; fetchedAt: number }` (`SunTimes` from `@/lib/time`; `fetchedAt` = `current.time`).
- `forecastResponseSchema` (Zod). Hourly arrays are `z.array(z.number())`, except `precipitation_probability` and `visibility`, which are `z.array(z.number().nullable())`. `type ForecastResponse = z.infer<typeof forecastResponseSchema>`.
- `normalizeForecast(raw: ForecastResponse, place: Place): Forecast`. `current` takes its fields from `raw.current`, and `precipitationProbability` and `visibility` from the hourly point at `nearestHourIndex`. Hourly arrays of different lengths → throw `UpstreamError('inconsistent hourly data')`.
- `class UpstreamError extends Error { constructor(message: string, readonly status?: number) }`.

- [ ] **Step 1: Tests** (with the fixture): `hours.length === 24`; `hours[3].time` is the current hour; `current.temperature === raw.current.temperature_2m`; `current.visibility === hours[3].visibility`; `sun.length === 3`, with `sun[i].day === raw.daily.time[i]`; `place` is passed through; `timezoneAbbreviation === raw.timezone_abbreviation`. Fixture with `visibility[5] = null` → `hours[5].visibility === null`. Fixture with `temperature_2m` one element shorter → throws `UpstreamError`. `forecastResponseSchema.safeParse({}).success === false`.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.

### Task 4.2: Fetchers for forecast and geocoding

**Files:** Create: `src/lib/weather/get-forecast.ts`, `src/lib/weather/get-forecast.test.ts`, `src/lib/geocoding/schema.ts`, `src/lib/geocoding/geocoding.ts`, `src/lib/geocoding/geocoding.test.ts`.

**Interfaces — Produces:**
- `getForecast(place: Place): Promise<Forecast>` — `fetch(url, { next: { revalidate: 600 } })`. `!res.ok` → `UpstreamError(…, res.status)`; schema failure → `UpstreamError('invalid forecast response')`.
- `searchPlaces(query: string, locale: Locale): Promise<Place[]>` — trims; fewer than 2 chars → `[]` without fetching. Fetches `…/v1/search?name=&count=5&language=` with `revalidate: 86400`. A missing `results` key means `[]`. `region` = `admin1`.
- `getPlaceById(id: number, locale: Locale): Promise<Place | null>` — `…/v1/get?id=&language=`. HTTP 400 with `{ error: true }` → `null`; other non-ok → `UpstreamError`.

- [ ] **Step 1: Tests** (mock `fetch` with `vi.stubGlobal`):
  - `getForecast` with the fixture → deep-equals `normalizeForecast(fixture, place)`, and the requested URL contains `past_hours=3` and `timeformat=unixtime`. Status 500 → rejects `UpstreamError` with `status 500`; body `{}` → rejects `UpstreamError`.
  - `searchPlaces('co', 'es')` → URL has `name=co` and `language=es`; `searchPlaces(' c ', 'en')` → `[]` and fetch not called; `{ generationtime_ms: 0.1 }` → `[]`.
  - `getPlaceById(999999999, 'en')` with status 400 `{"error":true,"reason":"Location ID not found."}` → `null`; status 500 → rejects; a London body → `{ id: 2643743, name: 'Londres', … }`.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.

### Task 4.3: Search endpoint

**Files:** Create: `src/app/api/search/route.ts`, `src/app/api/search/route.test.ts`.

**Interfaces — Produces:** `GET(request: Request): Promise<Response>`.
- `q` longer than 100 chars → 400 `{ error: 'query_too_long' }`.
- Invalid `lang` → `en`.
- Success → 200 `{ results: Place[] }` with `Cache-Control: public, s-maxage=3600`.
- `UpstreamError` → 502 `{ error: 'upstream' }`.

- [ ] **Step 1: Tests** (`vi.mock('@/lib/geocoding/geocoding')`): `?q=cor&lang=es` → 200, `searchPlaces` called with `('cor', 'es')`; `?q=cor&lang=fr` → called with `'en'`; `q` of 101 chars → 400; `searchPlaces` rejects `UpstreamError` → 502.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 3:** Close the block. Suggested commits: `feat(weather): validate and normalize Open-Meteo forecasts` · `feat(geocoding): add place search and lookup by id` · `feat(api): add /api/search endpoint`.

---

## Block 5 — `feat/routing`

### Task 5.1: Locale proxy

**Files:** Create: `src/proxy.ts`, `src/proxy.test.ts`.

**Interfaces — Produces:** `proxy(request: NextRequest): NextResponse` and `config.matcher = ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']`. A pathname that starts with `/en` or `/es` (exact or followed by `/`) → `NextResponse.next()`. Otherwise → 307 to `/${matchLocale(accept-language, NEXT_LOCALE cookie)}${pathname}${search}`.

- [ ] **Step 1: Tests:** `/` with `accept-language: es-AR` → 307, `location` ends with `/es`; `/?lat=1&lon=2` → location ends with `/en?lat=1&lon=2`; `/buenos-aires-3435910` with cookie `NEXT_LOCALE=es` → `/es/buenos-aires-3435910`; `/en/london-2643743` → no `location` header; `/english` → redirected (prefix only counts as a full segment).
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.

### Task 5.2: Layout, pages and the shared place view

**Files:** Delete: `src/app/page.tsx`, `src/app/layout.tsx`. Create: `src/app/[lang]/layout.tsx`, `src/app/[lang]/page.tsx`, `src/app/[lang]/[place]/page.tsx`, `src/components/PlaceView.tsx`, `src/components/Ventana.tsx` (temporary: renders place name, temperature and status as plain text).

**Interfaces:**
- Consumes: `getForecast`, `getPlaceById`, `parsePlaceParam`, `placePath`, `parseCoordinates`, `isLocale`, `getDictionary`, `parseUnit`, `UNIT_COOKIE`.
- Produces:
  - `PlaceView({ place, locale }: { place: Place; locale: Locale })` — async Server Component: reads the unit cookie, `getForecast(place)`, renders `<Ventana forecast={…} initialUnit={…} locale={…} dict={…} />`.
  - `Ventana` props: `{ forecast: Forecast; initialUnit: TemperatureUnit; locale: Locale; dict: Dictionary }` (`'use client'`).
- `[lang]/layout.tsx` is the root layout: `isLocale(lang)` or `notFound()`; `generateStaticParams` returns both locales; `<html lang={lang}>`.
- `[lang]/page.tsx`:
  - `lat`/`lon` present → `parseCoordinates` → `null` → `redirect(`/${lang}`)`; valid → place `{ id: null, name: dict.yourLocation, … }`.
  - Neither present → `getPlaceById(3435910, lang)`.
- `[place]/page.tsx`:
  - `parsePlaceParam` null → `notFound()`; `getPlaceById` null → `notFound()`.
  - Slug ≠ `slugify(place.name)` → `permanentRedirect(`/${lang}/${placePath(place.name, id)}`)`.
- `generateMetadata`: title `` `${place.name} — Ventana` ``; `alternates.languages` points to the same path under the other locale. Add the comment `// shortcut: alternate URL reuses this locale's slug and redirects to the canonical one; resolve per-locale names if SEO matters`.

- [ ] **Step 1:** Implement. Run `npm run build` → PASS. Run `npm run dev`, open `http://localhost:3000/`: it redirects to `/en` and shows "Buenos Aires" and a temperature.

### Task 5.3: Not-found and error pages

**Files:** Create: `src/app/[lang]/not-found.tsx`, `src/app/[lang]/error.tsx`.

- [ ] **Step 1:** `not-found.tsx` shows `dict.notFound.title` and `.body` (locale via `useParams` or the default). `error.tsx` (`'use client'`) shows `dict.error.title` and a button calling `reset()` with `dict.error.retry`. Both have the sky background (default theme). The search entry point is added in Task 8.2.

### Task 5.4: Routing e2e and CI job

**Files:** Create: `e2e/routing.spec.ts`. Modify: `.github/workflows/ci.yml`.

- [ ] **Step 1: Tests (Playwright):**
  - `/` with `locale: 'es-AR'` → URL ends `/es` and shows `Buenos Aires`.
  - `/es/london-2643743` → URL ends `/es/londres-2643743`.
  - `/en/nowhere-999999999` → shows "City not found".
  - `/en?lat=999&lon=0` → URL ends `/en`.
- [ ] **Step 2:** Run `npm run test:e2e` → PASS. Add the CI job `e2e` (`needs: checks`, `npx playwright install --with-deps chromium`, `npm run test:e2e`).
- [ ] **Step 3:** Close the block. Suggested commits: `feat(i18n): redirect to the preferred locale in proxy` · `feat(app): add localized routes for default, coordinate and city pages` · `feat(app): add not-found and error pages` · `test(e2e): cover locale and place routing` · `ci: run Playwright e2e tests`.

---

## Block 6 — `feat/main-screen`

### Task 6.1: Design tokens from Figma

**Files:** Modify: `src/app/[lang]/layout.tsx`, `src/app/globals.css`, `src/lib/sky/palette.ts`.

- [ ] **Step 1:** Load the `figma:figma-design-to-code` skill and call `get_design_context` once on file `s1HvGVKLLg1eQnJxo3ToZa`, node `1:274` (the free plan has a low monthly limit: one call only). Record the font families and weights, the type scale, the spacing and the gradient stops.
- [ ] **Step 2:** Load the fonts with `next/font/google` as CSS variables and expose them in `globals.css` via `@theme` (`--font-display`, `--font-sans`). If a font is not on Google Fonts, pick the closest one and ask the owner.
- [ ] **Step 3:** Replace the golden keyframe colors with the Figma gradient stops. Run `npm test` → PASS.

### Task 6.2: Sky layer and scene derivation

**Files:** Create: `src/components/Sky.tsx`, `src/lib/scene.ts`, `src/lib/scene.test.ts`. Modify: `src/app/globals.css`, `src/app/[lang]/layout.tsx`.

**Interfaces — Produces:**
- `type Scene = { point: HourPoint; status: TimelineStatus; condition: WeatherCondition; sun: SunTimes | null; daylight: number | null; theme: SkyTheme }`.
- `deriveScene(forecast: Forecast, selected: number): Scene`:
  - `point` = `forecast.current` when the status is `live`, else `hours[nearestHourIndex]`.
  - `now` = `forecast.current.time` (deterministic on server and client).
  - Altitude is computed at `selected` (continuous).
  - Raining = `isRainy(condition) || point.precipitation > 0`.
- `Sky()` — Server Component in the layout. Layers: a full-screen gradient `linear-gradient(to bottom, var(--sky-top), var(--sky-mid), var(--sky-bottom))`, the horizon haze, the diffuse cloud (`opacity: var(--cloud-opacity)`) and the SVG `feTurbulence` grain at opacity 0.06. `aria-hidden`.
- `globals.css`: register `@property` (`syntax: '<color>'`, `inherits: true`) for the 9 color variables, plus `--cloud-opacity` as `<number>`. `:root { transition: <each var> 600ms ease }`, disabled under `prefers-reduced-motion: reduce`.
- `Ventana` renders `<style>{themeToCss(scene.theme)}</style>`. The server HTML therefore paints the right sky on first load. Because `<Sky>` persists in the layout, client navigation changes `:root` values and CSS animates them.

- [ ] **Step 1: Tests:** with the fixture, `deriveScene(f, f.current.time)` → `status 'live'` and `point === f.current`; `deriveScene(f, f.hours[10].time)` → `'forecast'` and `point === f.hours[10]`; `deriveScene(f, f.hours[0].time)` → `'earlier'`; at local 03:00, `daylight === null`.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.

### Task 6.3: Screen components

**Files:** Create: `src/components/Header.tsx`, `src/components/LocalClock.tsx`, `src/components/SunArc.tsx`, `src/components/Temperature.tsx`, `src/components/Metrics.tsx`, `src/components/Footer.tsx`, `src/components/Metrics.test.tsx`, `src/components/Header.test.tsx`. Modify: `src/components/Ventana.tsx`. Install: `motion`.

**Interfaces — Produces** (all presentational, props only):
- `Header({ place, forecast, status, unit, onUnitChange, locale, dict, onOpenSearch, onBackToLive })`:
  - The status button calls `onBackToLive` and is only enabled when not live.
  - Unit toggle: two `aria-pressed` buttons, labelled by `dict.unitLabel`.
  - Language switch: `<Link>` to the same path under the other locale; on click it sets `NEXT_LOCALE` (`path=/; max-age=31536000; samesite=lax`).
  - Colors use `var(--ink-top)` / `var(--ink-top-2)`.
- `LocalClock({ timeZone, locale, initial })` — client; ticks at each minute boundary; `suppressHydrationWarning` on the `<time>`.
- `SunArc({ sun, daylight, timeZone, locale, dict })` — SVG arc with sunrise and sunset labels; the dot is hidden when `daylight === null`.
- `Temperature({ celsius, unit, condition, feelsLikeCelsius, dict })` — the number is wrapped in Motion `AnimatePresence` keyed by the displayed value (y 12 px → 0, 300 ms).
- `Metrics({ point, dict })` — wind `"18 km/h SE"`, humidity `%`, precipitation probability `%` or `—`, pressure `hPa` (rounded).
- `Footer({ forecast, locale, dict })` — updated time, place + `formatCoordinates`, visibility in km (1 decimal under 10 km, else integer) or `—`.
- `Ventana` holds `unit` state (initialized from `initialUnit`). The toggle writes the `unit` cookie (same attributes as above). It wraps everything in `<MotionConfig reducedMotion="user">`. Layout follows the design at ≥ 768 px, with a single centered column below.

- [ ] **Step 1: Tests:**
  - `Metrics` with `windSpeed 18.4, windDirection 135, humidity 72, precipitationProbability null, pressure 1016.2` and the `es` dict → shows `18 km/h`, `SE`, `72%`, `—`, `1016 hPa`, `Barómetro`.
  - `Header`: clicking `°F` calls `onUnitChange('f')`; the language link for `/en/london-2643743` points to `/es/london-2643743`; the status button is disabled when live.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 3:** Visual check with `npm run dev` against `docs/design/main-desktop.png` at 1280×1024 and 390×844. Every text uses the zone ink variables.
- [ ] **Step 4:** Close the block. Suggested commits: `feat(design): load fonts and calibrate golden-hour palette from Figma` · `feat(sky): render persistent sky layer with animated CSS variables` · `feat(ui): build header, sun arc, temperature, metrics and footer`.

---

## Block 7 — `feat/timeline`

### Task 7.1: Ruler with native range input

**Files:** Create: `src/components/Timeline.tsx`, `src/components/Timeline.test.tsx`. Modify: `src/components/Ventana.tsx`.

**Interfaces — Produces:**
- `Timeline({ hours, value, onChange, timeZone, locale, unit, dict, now })`.
- The visual ruler: an hour tick and label per point, a temperature above, a needle at `value`, and a header row (`dict.timeline.title`, `now` time, country).
- On top sits an `<input type="range" min={hours[0].time} max={hours[23].time} step={60}>` (`opacity-0`, full size, `aria-label={dict.timeline.label}`).
- `aria-valuetext` = `` `${formatTime(value)}, ${toUnit(temp)} ${dict.degrees}` ``.
- Arrow keys move ±3600 s (clamped, `preventDefault`); Home/End stay native.
- Focus ring on the needle via Tailwind `peer-focus-visible`.
- Below 768 px, labels show only for hours where `formatHour % 3 === 0`.
- `Ventana` adds the state `selected` (initial `forecast.current.time`), `onBackToLive` → `setSelected(forecast.current.time)`, and `deriveScene(forecast, selected)` on every render.

- [ ] **Step 1: Tests:**
  - Focus the slider, press `ArrowRight` → `onChange(value + 3600)`.
  - At the max, `ArrowRight` → `onChange(max)`.
  - `aria-valuetext` matches `/^\d{2}:\d{2}, \d+ degrees$/`.
  - Rendering `Ventana` with the fixture and pressing `ArrowRight` on the slider changes the status text from `LIVE` to `FORECAST`; clicking the status returns to `LIVE`.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.

### Task 7.2: Wheel scrubbing

**Files:** Create: `src/lib/hooks/use-wheel-scrub.ts`, `src/lib/hooks/use-wheel-scrub.test.tsx`. Modify: `src/components/Ventana.tsx`.

**Interfaces — Produces:** `useWheelScrub({ enabled, onDelta }: { enabled: boolean; onDelta: (seconds: number) => void }): void`. It listens on `window` for `wheel` (`passive: true`) and calls `onDelta(Math.round(event.deltaY * 36))` (≈ 100 px per notch → 1 h). `Ventana` clamps to the window and disables it while search is open.

- [ ] **Step 1: Tests:** a `wheel` event with `deltaY: 100` → `onDelta(3600)`; with `enabled: false` → not called; after unmount → not called.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 3:** Close the block. Suggested commits: `feat(timeline): add accessible 24-hour ruler` · `feat(timeline): scrub hours with the mouse wheel`.

---

## Block 8 — `feat/search`

### Task 8.1: Search overlay

**Files:** Create: `src/components/SearchOverlay.tsx`, `src/components/SearchOverlay.test.tsx`, `src/lib/hooks/use-debounced-value.ts`. Modify: `src/components/Ventana.tsx`, `src/components/Header.tsx`.

**Interfaces — Produces:**
- `useDebouncedValue<T>(value: T, delayMs: number): T`.
- `SearchOverlay({ open, onClose, locale, dict })`:
  - Wrapped in `AnimatePresence`: fade + `backdrop-filter: blur(16px)` and dimming, 250 ms.
  - Input `role="combobox"` with `aria-expanded`, `aria-controls`, `aria-activedescendant`. Listbox `role="listbox"`, options `role="option"` with the text `"Name, Region, Country"`.
  - Debounce 300 ms. Fetch `/api/search?q=&lang=` with an `AbortController`; the previous request is aborted when the query changes.
  - `ArrowDown`/`ArrowUp` move; `Enter` → `router.push(`/${locale}/${placePath(name, id)}`)` and close; `Esc` and a click on the backdrop → `onClose`.
  - Focus goes to the input on open and back to the trigger on close.
  - Messages: `dict.search.noResults` (empty list), `dict.search.unavailable` (non-ok or network error).
- `Ventana`: `searchOpen` state. It opens from the Header city name or the search button, and from the `/` key unless focus is in an input.

- [ ] **Step 1: Tests** (fake timers, mocked `fetch`, mocked `next/navigation`):
  - Typing `co` → one fetch after 300 ms with `q=co&lang=en`.
  - Typing `cor` then `cord` quickly, where the `cor` response resolves last → only `cord` results are shown, and the `cor` request was aborted.
  - `ArrowDown` + `Enter` → `push('/en/cordoba-3860259')`.
  - `{ results: [] }` → "We couldn't find that city"; status 502 → "Search is unavailable right now".
  - `Escape` → `onClose`.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.

### Task 8.2: Use my location

**Files:** Modify: `src/components/SearchOverlay.tsx`, `src/components/SearchOverlay.test.tsx`, `src/app/[lang]/not-found.tsx`.

- [ ] **Step 1: Tests:**
  - `navigator.geolocation.getCurrentPosition` succeeds with `-34.61315, -58.37723` → `push('/en?lat=-34.6132&lon=-58.3772')`.
  - Error code 1 → "Location permission was denied"; error code 2 → "We couldn't get your location".
  - No `navigator.geolocation` → "We couldn't get your location".
- [ ] **Step 2:** Run → FAIL. Implement (coordinates rounded to 4 decimals). Run → PASS.
- [ ] **Step 3:** Add a search trigger to `not-found.tsx` (it opens `SearchOverlay`).
- [ ] **Step 4:** Close the block. Suggested commits: `feat(search): add city search overlay with accessible combobox` · `feat(search): navigate to the user's location`.

---

## Block 9 — `chore/release-v1`

### Task 9.1: Main-flow e2e

**Files:** Create: `e2e/main-flow.spec.ts`.

- [ ] **Step 1: Test (Playwright):**
  - Open `/` → URL matches `/en`; a temperature matching `/\d+/` is visible; the status says `LIVE`.
  - Focus the slider and press `ArrowRight` → `FORECAST`.
  - Press `/`, type `Córdoba`, pick the first option → the URL matches `/en\/cordoba-\d+/`.
  - Switch to ES → `EN VIVO` or `PRONÓSTICO` is visible.
- [ ] **Step 2:** Run `npm run test:e2e` → PASS.

### Task 9.2: README

**Files:** Modify: `README.md`.

- [ ] **Step 1:** Write the README in English, as a case study:
  - What it is, with a screenshot (`docs/design/` plus a real screenshot from the app).
  - Live URL.
  - Stack.
  - Architecture diagram (from the spec).
  - Key decisions (the decision log).
  - How to run, test and contribute.
  - A link to the old version (`paulakunning/weather-app`).

### Task 9.3: Deploy and audit

- [ ] **Step 1:** The owner signs in to Vercel and imports the repo (manual step). Confirm a preview deployment for the PR.
- [ ] **Step 2:** Run Lighthouse (mobile) on the preview URL. Expected: Performance ≥ 90, Accessibility ≥ 95. Fix regressions and add the live URL to the README.
- [ ] **Step 3:** Close the block. Suggested commits: `test(e2e): cover the main user flow` · `docs: write README case study`.
