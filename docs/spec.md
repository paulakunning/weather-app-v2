# Weather App — Technical Specification (v1)

> Date: 2026-10-11 · Status: approved in conversation, pending written review
> Design reference: [`docs/design/main-desktop.png`](design/main-desktop.png) (Figma file "Weather App", frame `1:274`)

## 1. Goal

Rebuild the 2022 bootcamp weather app (CRA + Chakra + OpenWeather) from scratch as a portfolio piece for **semi-senior front-end / design engineer** roles.

The idea: **the screen is the sky of the city right now**. No cards, no icons: the atmosphere (a gradient computed from real data) communicates the weather, and typography carries the data. A 24-hour ruler lets you "travel" through the day and watch the sky and the data change.

Success criteria:

- It looks like the Figma design, with real data for any city.
- It feels fluid: sky transitions are continuous.
- Accessible (WCAG AA) and fast (Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95).
- Every decision can be explained in an interview: they are all documented here.

## 2. Scope

### In v1

1. The main screen from the design, with real data (Open-Meteo).
2. Computed sky: gradient driven by the real sun altitude, cloud cover and rain.
3. Interactive 24-hour ruler: moving it updates the sky, temperature, metrics and the sun on the arc.
4. City search with suggestions, and a sky transition when switching cities.
5. "Use my location" button inside the search (no permission prompt on page load).
6. Shareable URL per city.
7. °C / °F toggle.
8. English and Spanish interface (English by default).
9. Responsive and accessible (keyboard, screen readers, reduced motion, automatic contrast).
10. Server layer: data fetching, validation, caching and our own search endpoint.
11. Unit and component tests, one end-to-end test, CI, and deployment on Vercel.

### Out of v1 (possible follow-ups)

- The "settings" button from the design (not rendered in v1).
- 7-day forecast, saved cities, more languages.
- Live typography (letters reacting to the weather), animated rain, WebGL shader.
- A city name for "Your location" (Open-Meteo has no reverse geocoding).

## 3. Stack

| Piece      | Choice                                            | Why                                                                                         |
| ---------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router)                           | Server Components fetch data on the server; routes and endpoints without a separate backend |
| Language   | TypeScript, `strict` + `noUncheckedIndexedAccess` | Learning goal; catches errors while editing                                                 |
| Styling    | Tailwind CSS                                      | Fast layout work; dynamic colors go through CSS variables                                   |
| Animation  | Motion (formerly Framer Motion) + CSS `@property` | Motion for enter/exit and numbers; CSS for the sky                                          |
| Validation | Zod                                               | Validates external data and generates the types                                             |
| Sun        | `suncalc`                                         | Exact sun altitude; no reinventing astronomy                                                |
| Color      | `culori`                                          | OKLCH color mixing (no "muddy" mid-gradient tones) and WCAG contrast                        |
| i18n       | Next's built-in `[lang]` segment + dictionaries   | Few strings; no library needed                                                              |
| Tests      | Vitest + Testing Library + Playwright             | Unit tests for pure logic, component tests for interactions, one e2e for the main flow      |
| Quality    | ESLint + Prettier                                 | Consistent style, enforced in CI                                                            |
| Deploy     | Vercel + GitHub Actions                           | Preview per PR; CI runs lint, types, tests and build                                        |

Exact versions are pinned when the project is scaffolded.

## 4. Architecture

```
Server (Next)                                      Browser
─────────────                                      ───────
app/[lang]/[place]/page.tsx  (Server Component)
 ├─ resolves the place (id → name and coordinates)
 ├─ getForecast(lat, lon)  → Open-Meteo
 │    ├─ validates with Zod
 │    ├─ normalizes into our Forecast type
 │    └─ caches for 10 min
 └─ renders <WeatherApp forecast unit dict />  ────►  <WeatherApp> (Client Component)
                                                       state: selectedTime
                                                       derived: hour point, sun,
                                                       sky palette, text colors
app/api/search/route.ts  ◄─────────────────────────  <SearchOverlay> requests suggestions
 └─ Open-Meteo Geocoding (validated, cached 1 day)
proxy.ts: "/" → "/en" or "/es" (cookie, then Accept-Language)
```

Principle: **data is fetched on the server; interaction lives on the client**. The only piece of state is the time selected on the ruler; everything else is **derived** from the data plus that time (never duplicated into more state).

### Routes

| URL                                                     | Shows                                                                                                                                                                                                                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                     | Redirects to `/en` or `/es` (see §6)                                                                                                                                                                                                                      |
| `/{lang}`                                               | Buenos Aires (id 3435910)                                                                                                                                                                                                                                 |
| `/{lang}/{slug}-{id}` (e.g. `/en/buenos-aires-3435910`) | The city with that Open-Meteo id. The id avoids ambiguity: "Buenos Aires" exists in Argentina and in Nicaragua. If the slug does not match the city's name in that language, redirect to the canonical URL (`/es/londres-2643743` ↔ `/en/london-2643743`) |
| `/{lang}?lat=-34.60&lon=-58.38`                         | "Your location" at those coordinates. Invalid lat/lon (out of range or not numeric) → redirect to `/{lang}`                                                                                                                                               |
| `/api/search?q=text&lang=en`                            | JSON with up to 5 cities. `q` shorter than 2 characters → empty list                                                                                                                                                                                      |

### Folder structure

```
src/
  proxy.ts                  locale redirect for "/"
  app/
    [lang]/
      layout.tsx            fonts, <html lang>, persistent <Sky>, metadata
      page.tsx              default city or ?lat&lon
      [place]/page.tsx      city by id
      not-found.tsx         unknown city
      error.tsx             API failure, with "Try again"
    api/search/route.ts     search endpoint
  components/               WeatherApp, Sky, Header, SunArc, Temperature,
                            Metrics, Timeline, SearchOverlay, Footer
  i18n/                     config, en.ts, es.ts, getDictionary
  lib/
    weather/                fetch + Zod schemas + types (server only)
    geocoding/              search and lookup by id (server only)
    sky/                    palettes, mixing, contrast (pure)
    time.ts, units.ts, weather-codes.ts, slug.ts   (pure)
```

Modules in `lib/weather` and `lib/geocoding` import `server-only`: if one is accidentally used in the browser, the build fails.

## 5. Data

### Sources

- Forecast: `https://api.open-meteo.com/v1/forecast` with `timezone=auto` and `timeformat=unixtime`.
  - `current`: temperature, apparent temperature, humidity, weather code, cloud cover, wind (speed and direction), sea-level pressure.
  - `hourly`: the same plus precipitation probability, precipitation and visibility.
  - Hourly window: **24 points**, from 3 hours before the current hour to 20 hours after it.
  - `daily`: sunrise and sunset for the 2 days the window spans.
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=…&count=5&language={lang}` and `…/v1/get?id=…&language={lang}`.

### Why UTC

Times are requested as UTC (`unixtime`) and displayed with `Intl.DateTimeFormat` in the city's time zone (the `timezone` returned by the API). The viewer's time zone never leaks into the city's time.

### Our own types (after normalization)

```ts
type Place = {
  id: number | null; // null = "Your location"
  name: string; // "Buenos Aires" | "Your location"
  region?: string; // "Ciudad Autónoma de Buenos Aires" (admin1)
  country?: string; // "Argentina"
  latitude: number;
  longitude: number;
};

type HourPoint = {
  time: number; // unix seconds, UTC
  temperature: number; // °C
  apparentTemperature: number;
  humidity: number; // %
  precipitationProbability: number; // %
  precipitation: number; // mm
  weatherCode: number; // WMO code
  cloudCover: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees
  pressure: number; // hPa
  visibility: number; // meters
};

type Forecast = {
  place: Place;
  timezone: string; // "America/Argentina/Buenos_Aires"
  timezoneAbbreviation: string; // "ART" (falls back to the offset, e.g. "GMT-3")
  current: HourPoint; // fields missing from `current` are taken from the current hour in `hourly`
  hours: HourPoint[]; // 24 points
  sun: { sunrise: number; sunset: number }[];
  fetchedAt: number;
};
```

### Validation and caching

- Every external response goes through a Zod schema before use. If it doesn't match → handled error (`error.tsx`), never `undefined` on screen.
- Server cache: forecast 10 minutes, geocoding 24 hours.
- WMO weather codes map to text through our own table (`weather-codes.ts`), one entry per language, e.g. `2 → "Partly cloudy" / "Parcialmente nublado"`.

## 6. Internationalization

- Locales: `en` (default) and `es`. The locale is the first URL segment (`/en/...`, `/es/...`): each language has its own shareable, indexable URL.
- `proxy.ts` handles requests without a locale (`/`, `/buenos-aires-3435910`): it uses the `NEXT_LOCALE` cookie if present, otherwise the best match from the browser's `Accept-Language` header, otherwise `en`.
- Dictionaries: one typed object per language (`en.ts`, `es.ts`). `es` must satisfy the type of `en`, so a missing translation is a compile error.
- Dates, times and numbers are formatted with `Intl` using the active locale.
- City names come from Open-Meteo in the active language (`language=` parameter).
- Header language switch (`EN / ES`), styled like the °C/°F toggle: it links to the same page in the other language and stores the choice in the `NEXT_LOCALE` cookie.
- `<html lang>` follows the locale, and each page declares its alternate-language URL (`hreflang`).

## 7. The sky

### Palette

- `sunAltitude(date, lat, lon)` (via `suncalc`) returns the sun altitude in degrees.
- Base palettes by sun altitude, each with 3 colors (top / middle / bottom):

| Sun altitude | Moment                                                      |
| ------------ | ----------------------------------------------------------- |
| ≤ −18°       | Night                                                       |
| −12°         | Nautical twilight                                           |
| −4°          | Civil twilight                                              |
| +4°          | Golden hour (the one in the design: indigo → mauve → coral) |
| ≥ +25°       | Day                                                         |

- Between two palettes, colors are interpolated in **OKLCH** using the exact altitude, so the sky changes continuously, even between hours.
- Cloud cover (0–100 %) pulls the colors toward a gray of the same lightness (up to a 60 % mix at full cover).
- Rain (precipitation > 0 or a rain/storm code) lowers saturation and lightness one step further.
- Layers from the design: main gradient + low horizon haze + diffuse cloud (its opacity grows with cloud cover) + static film grain (SVG `feTurbulence`, low opacity).

### Automatic contrast

- Text keeps the position from the design; **its color is computed from the background right behind it**: header → top color, center → middle color, ruler and footer → bottom color.
- Each zone picks a light ink (white) or a dark ink (very dark indigo), whichever gives the higher contrast.
- Secondary text uses the same ink with transparency. The transparency is adjusted so the resulting color (blended with the background) meets **4.5:1** (small text) or **3:1** (text ≥ 24 px). This fixes the low-contrast footer text in the design.

### How it is applied

- `<Sky>` lives in the `[lang]` layout, so it is not unmounted when the city changes and the color transition stays continuous.
- `<WeatherApp>` writes the colors as CSS variables (`--sky-top`, `--sky-mid`, `--sky-bottom`, `--ink-top`…) on the document.
- The variables are registered with `@property` (type `<color>`), which lets CSS animate them with `transition`.

## 8. Components and behavior

### Header

- Left: city name (opens the search) · real local time (updates every minute) + time-zone abbreviation.
- Right: status indicator · °C/°F · EN/ES · search button · "WEATHER APP" brand. The settings button is not in v1.
- Status indicator: "LIVE" when the ruler is at the current moment; "FORECAST" when it is in the future, "EARLIER" when it is in the past. Clicking it returns to the current moment.

### Sun arc

- Shows the local day containing the selected moment: sunrise and sunset with their times.
- The sun dot is placed by the fraction of daylight elapsed; it is hidden at night.

### Temperature and metrics

- Monumental number: temperature at the selected moment (current values when "LIVE"; otherwise the nearest hour). When it changes, the number transitions with Motion.
- Below it: condition (WMO code → text) and apparent temperature ("Feels like").
- Metrics row: wind (km/h + compass direction), humidity, precipitation probability, pressure.
- °C/°F changes temperatures only (wind stays in km/h). The preference is stored in a **cookie** the server reads, so the page arrives with the right unit (no flash).

### 24-hour ruler

- Underneath it is a native `<input type="range">` (invisible) with the ruler design drawn on top. Keyboard (arrows, Home/End) and screen readers work with no extra code. `aria-valuetext` announces time and temperature, e.g. "11 PM, 12 degrees".
- Continuous value (minutes), from the first to the last point in the window. It moves by:
  - dragging the ruler;
  - the mouse wheel or trackpad anywhere on the screen (there is no page scroll: it is a single view);
  - the keyboard.
- Labels: temperature above and hour below each hour mark; on mobile (< 768 px) labels show every 3 hours, ticks for every hour.
- The right-hand label of the ruler header shows the country (the design's "RÍO DE LA PLATA" slot); hidden for "Your location".

### Search

- Opens from the city name, the search button or the `/` key. Closes with `Esc` or by clicking outside.
- The sky blurs and dims; the large input floats over the sky (no modal box), as in the design.
- Suggestions: 300 ms after the last keystroke, minimum 2 characters, up to 5 results ("City, Region, Country"). ARIA _combobox_ pattern: arrows to move, Enter to pick.
- Picking a city → navigates to `/{lang}/{slug}-{id}`.
- "Use my location": asks the browser for permission → navigates to `/{lang}?lat&lon`. If denied or unavailable, the reason is shown inside the search.

### Footer

- Same positions as the design: last update time · place and coordinates · visibility.

## 9. Animation and motion

| What                      | How                                              | Approx. duration |
| ------------------------- | ------------------------------------------------ | ---------------- |
| Sky (time or city change) | `transition` on `@property` variables            | 600 ms           |
| Temperature number        | Motion (vertical exit/enter)                     | 300 ms           |
| Search open/close         | Motion `AnimatePresence` + background blur       | 250 ms           |
| Dragging the ruler        | No transition (follows the pointer in real time) | —                |

With the system's "reduce motion" setting on (`prefers-reduced-motion`), transitions become instant (`MotionConfig reducedMotion="user"` + a CSS media query).

## 10. Errors

| Situation                                 | What the person sees                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| Unknown city id                           | `not-found.tsx` in the same style, with the search                             |
| Open-Meteo down or invalid response       | `error.tsx`: clear message + "Try again" button                                |
| Search with no results                    | "We couldn't find that city" inside the search                                 |
| Search endpoint failure                   | "Search is unavailable right now" inside the search (the screen keeps working) |
| Location permission denied or unavailable | Message inside the search; the current city stays                              |
| Invalid `lat`/`lon` in the URL            | Redirect to `/{lang}`                                                          |
| Unsupported locale in the URL (`/fr/...`) | 404                                                                            |

## 11. Typography and design colors

- Display (city, brand, number): high-contrast serif; data: geometric sans. Exact families, sizes and colors are taken from Figma (`get_design_context` on `1:274`) when layout work starts, and loaded with `next/font`. If a font is not on Google Fonts, the closest alternative is chosen and confirmed with the designer.
- The "golden hour" palette (§7) is calibrated against the design's gradient colors.
- The design's Spanish copy is translated for `en`.

## 12. Quality

### Code standards

- TypeScript `strict` and `noUncheckedIndexedAccess`; no `any`.
- Pure logic (`lib/sky`, `time`, `units`, `slug`, `weather-codes`) has no React or network dependencies, so it is easy to test.
- Naming: components in `PascalCase.tsx`, other modules in `kebab-case.ts`, functions and variables in `camelCase`, types in `PascalCase`, booleans with `is`/`has`. Tests live next to their source as `*.test.ts(x)`.
- ESLint (Next + TypeScript rules) and Prettier; both run in CI.
- Pure logic is built test-first.

### Unit tests (Vitest)

- Palettes: interpolation between moments, effect of clouds and rain.
- Contrast: the chosen ink and transparency meet the minimums.
- Time: formatting in the city's time zone, nearest hour point, 24-hour window.
- Units (°C → °F), wind compass direction, WMO code table (both languages).
- Normalization: Open-Meteo response (JSON fixture) → `Forecast`; invalid response → error.
- Slug: `{slug}-{id}` builds and parses correctly (accents, spaces).
- Locale detection from `Accept-Language` and the cookie.

### Component tests (Testing Library)

- Ruler: keyboard moves the value, `aria-valuetext` is correct, the status changes to "FORECAST".
- Search: debounced suggestions, arrow navigation, Enter navigates, error messages.

### End-to-end test (Playwright)

- Opens `/`, gets redirected to a locale, sees a temperature, moves the ruler with the keyboard and the status changes to "FORECAST", searches for "Córdoba", picks a result and the URL changes, switches to ES and the copy changes.
- Uses the real API (smoke test: checks structure, not values).

### CI and deployment

- GitHub Actions on every PR: lint, type check, unit and component tests, build and e2e.
- Vercel connected to the repo: preview per PR and production from `main`. The initial connection needs a manual Vercel login with the project owner's account.

## 13. Workflow

### Branches

- `main` always works and is deployable. Nothing is developed directly on it.
- One branch per work block, named `<type>/<short-kebab-description>`, e.g. `feat/sky-palette`, `chore/project-setup`, `docs/readme`.
- Types (Conventional Commits): `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`.

### Review and commits

1. Claude implements the block and leaves **all changes staged**, without committing.
2. The owner reviews the staged diff (in the editor) and approves or asks for changes.
3. Once the diff is approved, Claude makes the atomic commits for the block.
4. Commits follow [Conventional Commits](https://www.conventionalcommits.org/): English, imperative, ≤ 72-character subject, e.g. `feat(sky): interpolate palettes in OKLCH by sun altitude`. Each commit is one logical change and leaves the project working. No tool attribution in messages.
5. Push → Pull Request with a description (what, why, how to test) → CI green.
6. The owner merges the PR on GitHub with a merge commit (keeps the atomic commits in history). Claude never merges.

### Learning

- At the end of each block: an explanation of the key points (TypeScript notes comparing with plain JavaScript, server-side notes whenever backend code appears) and a short multiple-choice quiz on logic, architecture and key functions. Chat is in Spanish; code and docs in English.
- The implementation plan (blocks and order) is written separately, after this spec is approved.

## 14. Decision log

| Decision                             | Rejected alternative                | Reason                                                                       |
| ------------------------------------ | ----------------------------------- | ---------------------------------------------------------------------------- |
| Sky with CSS gradients               | WebGL shader                        | Lighter and easier to explain; enough for the design                         |
| Data fetched on the server           | Fetching from the browser           | Complete screen with no loading state, shared cache, validation in one place |
| Own search endpoint                  | Calling Open-Meteo from the browser | Normalize and validate in one place; learn how an endpoint is built          |
| Native `input range` under the ruler | Fully custom slider                 | Accessibility and keyboard support without reinventing them                  |
| Location via a button                | Prompting on page load              | Better UX: permission is requested with context                              |
| `{slug}-{id}` URLs                   | Name only                           | Avoids same-name cities                                                      |
| Unit in a cookie                     | `localStorage`                      | The server knows it: no flash, no hydration mismatch                         |
| Locale in the URL path               | Cookie only                         | Each language gets its own shareable, indexable URL                          |
| Built-in i18n                        | `next-intl`                         | Few strings; typed dictionaries are enough                                   |
| Open-Meteo                           | OpenWeather                         | Free, no API key, hourly and sun data in one request                         |
| Merge commits to `main`              | Squash merge                        | Keeps the atomic commits                                                     |
