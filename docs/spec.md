# Ventana — Especificación técnica (v1)

> Fecha: 2026-10-11 · Estado: aprobada en conversación, pendiente de revisión escrita
> Diseño de referencia: [`docs/design/main-desktop.png`](design/main-desktop.png) (Figma: archivo "Weather App", frame `1:274`)

## 1. Objetivo

Rehacer desde cero la weather app del bootcamp (2022, CRA + Chakra + OpenWeather) como una pieza de portfolio para búsquedas de **front end semi senior / design engineer**.

La idea: **la pantalla es el cielo de la ciudad en este momento**. Sin tarjetas ni íconos: la atmósfera (un degradé calculado con datos reales) comunica el clima y la tipografía lleva los datos. Una regla de 24 horas permite "viajar" por el día y ver cómo cambian el cielo y los datos.

Criterios de éxito:
- Se ve como el diseño de Figma, con datos reales de cualquier ciudad.
- Se siente fluida: las transiciones de cielo son continuas.
- Accesible (WCAG AA) y rápida (Lighthouse mobile: Performance ≥ 90, Accesibilidad ≥ 95).
- El código se puede explicar en una entrevista: cada decisión está documentada acá.

## 2. Alcance

### Entra en v1
1. Pantalla principal del diseño con datos reales (Open-Meteo).
2. Cielo calculado: degradé según la altura real del sol, la nubosidad y la lluvia.
3. Regla de 24 h interactiva: al moverla, cambian el cielo, la temperatura, los datos y el sol en el arco.
4. Buscador de ciudades con sugerencias y transición de cielo al cambiar de ciudad.
5. Botón "Usar mi ubicación" dentro del buscador (no se pide permiso al entrar).
6. URL compartible por ciudad.
7. Alternar °C / °F.
8. Responsive y accesible (teclado, lector de pantalla, reducir movimiento, contraste automático).
9. Capa de servidor: obtención de datos, validación, caché y un endpoint propio de búsqueda.
10. Tests unitarios + un test de punta a punta + CI + deploy en Vercel.

### Fuera de v1 (posibles mejoras)
- El botón de "ajustes" del diseño (no se muestra en v1).
- Pronóstico de 7 días, ciudades guardadas, versión en inglés.
- Tipografía viva (letras que reaccionan al clima), lluvia animada, shader WebGL.
- Nombre de ciudad para "Tu ubicación" (Open-Meteo no hace geocodificación inversa).

## 3. Stack y convenciones

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | Next.js (App Router), última versión estable | Server Components para traer datos en el servidor; rutas y endpoints sin un back aparte |
| Lenguaje | TypeScript en modo `strict` | Objetivo de aprendizaje; errores en tiempo de edición |
| Estilos | Tailwind CSS | Rápido para maquetar; los colores dinámicos van por variables CSS |
| Animación | Motion (ex Framer Motion) + CSS `@property` | Motion para entradas/salidas y números; CSS para el cielo |
| Validación | Zod | Valida datos externos y genera los tipos |
| Sol | `suncalc` | Altura del sol exacta; no reinventamos astronomía |
| Color | `culori` | Mezcla de colores en OKLCH (degradés sin tonos "barrosos") y cálculo de contraste WCAG |
| Tests | Vitest + Playwright | Unitarios para la lógica pura, un e2e para el flujo principal |
| Deploy | Vercel + GitHub Actions | Preview por PR; CI con lint, tipos, tests y build |

Convenciones:
- Interfaz en **español**; código (variables, funciones, archivos) en **inglés**; documentación en español.
- Commits en inglés con formato *conventional commits* (`feat:`, `fix:`, `docs:`…), sin firmas de herramientas.
- Una rama por bloque de trabajo → PR → merge a `main`.

## 4. Arquitectura

```
Servidor (Next)                                   Navegador
────────────────                                  ─────────
app/[place]/page.tsx  (Server Component)
 ├─ resuelve el lugar (id → nombre y coordenadas)
 ├─ getForecast(lat, lon)  → Open-Meteo
 │    ├─ valida con Zod
 │    ├─ normaliza a nuestro tipo Forecast
 │    └─ caché 10 min
 └─ renderiza <Ventana forecast unit />  ───────►  <Ventana> (Client Component)
                                                     estado: selectedTime
                                                     derivado: punto horario, sol,
                                                     paleta del cielo, colores de texto
app/api/search/route.ts  ◄───────────────────────  <SearchOverlay> pide sugerencias
 └─ Open-Meteo Geocoding (validado, caché 1 día)
```

Principio: **los datos se traen en el servidor; la interacción vive en el cliente**. La única parte "con estado" es la hora elegida en la regla; todo lo demás se **deriva** de los datos + esa hora (no se duplica en más estados).

### Rutas

| URL | Qué muestra |
|---|---|
| `/` | Buenos Aires (id 3435910) |
| `/{slug}-{id}` (ej. `/buenos-aires-3435910`) | La ciudad con ese id de Open-Meteo. El id evita ambigüedades (Córdoba AR vs. ES). Si el slug no coincide con el nombre real, redirige a la URL correcta |
| `/?lat=-34.60&lon=-58.38` | "Tu ubicación" en esas coordenadas. Si lat/lon son inválidas (fuera de rango o no numéricas) → redirige a `/` |
| `/api/search?q=texto` | JSON con hasta 5 ciudades. `q` de menos de 2 caracteres → lista vacía |

### Estructura de carpetas

```
src/
  app/
    layout.tsx            fuentes, <Sky> persistente, metadatos
    page.tsx              ciudad por defecto o ?lat&lon
    [place]/page.tsx      ciudad por id
    api/search/route.ts   endpoint de búsqueda
    not-found.tsx         ciudad inexistente
    error.tsx             falla de la API, con "reintentar"
  components/             Ventana, Sky, Header, SunArc, Temperature,
                          Metrics, Timeline, SearchOverlay, Footer
  lib/
    weather/              fetch + esquemas Zod + tipos (solo servidor)
    geocoding/            búsqueda y resolución por id (solo servidor)
    sky/                  paletas, mezcla y contraste (puro)
    time.ts, units.ts, weather-codes.ts   (puro)
```

Los módulos de `lib/weather` y `lib/geocoding` importan `server-only`: si por error se usan en el navegador, el build falla.

## 5. Datos

### Fuente
- Pronóstico: `https://api.open-meteo.com/v1/forecast` con `timezone=auto` y `timeformat=unixtime`.
  - `current`: temperatura, sensación térmica, humedad, código de clima, nubosidad, viento (velocidad y dirección), presión al nivel del mar.
  - `hourly`: lo mismo + probabilidad de precipitación, precipitación y visibilidad.
  - Ventana horaria: **24 puntos**, desde 3 horas antes de la hora actual hasta 20 horas después.
  - `daily`: salida y puesta del sol para los 2 días que toca la ventana.
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=…&count=5&language=es` y `…/v1/get?id=…`.

### Por qué UTC
Las horas se piden en UTC (`unixtime`) y se muestran con `Intl.DateTimeFormat` en la zona horaria de la ciudad (`timezone` que devuelve la API). Así nunca se mezcla la hora de la persona que mira con la de la ciudad.

### Tipos propios (resultado de normalizar)

```ts
type Place = {
  id: number | null;          // null = "Tu ubicación"
  name: string;               // "Buenos Aires" | "Tu ubicación"
  region?: string;            // "Ciudad Autónoma de Buenos Aires" (admin1)
  country?: string;           // "Argentina"
  latitude: number;
  longitude: number;
};

type HourPoint = {
  time: number;               // unix (segundos, UTC)
  temperature: number;        // °C
  apparentTemperature: number;
  humidity: number;           // %
  precipitationProbability: number; // %
  precipitation: number;      // mm
  weatherCode: number;        // código WMO
  cloudCover: number;         // %
  windSpeed: number;          // km/h
  windDirection: number;      // grados
  pressure: number;           // hPa
  visibility: number;         // metros
};

type Forecast = {
  place: Place;
  timezone: string;           // "America/Argentina/Buenos_Aires"
  timezoneAbbreviation: string; // "ART" (si no viene, se usa el offset: "GMT-3")
  current: HourPoint;         // si un campo no viene en `current`, se toma de la hora actual de `hourly`
  hours: HourPoint[];         // 24 puntos
  sun: { sunrise: number; sunset: number }[];
  fetchedAt: number;
};
```

### Validación y caché
- Toda respuesta externa pasa por un esquema Zod antes de usarse. Si no cumple → error controlado (`error.tsx`), nunca `undefined` en pantalla.
- Caché del servidor: pronóstico 10 minutos, geocoding 24 horas.
- Los códigos WMO se traducen a texto en español con una tabla propia (`weather-codes.ts`), ej. `2 → "Parcialmente nublado"`.

## 6. El cielo

### Paleta
- `sunAltitude(date, lat, lon)` (con `suncalc`) devuelve la altura del sol en grados.
- Paletas base por altura del sol, cada una con 3 colores (arriba / medio / abajo):

| Altura del sol | Momento |
|---|---|
| ≤ −18° | Noche |
| −12° | Crepúsculo náutico |
| −4° | Crepúsculo civil |
| +4° | Hora dorada (la del diseño: índigo → malva → coral) |
| ≥ +25° | Día |

- Entre dos paletas se interpola en **OKLCH** según la altura exacta → el cielo cambia de forma continua, incluso entre horas.
- Nubosidad (0–100 %): acerca los colores a un gris de la misma luminosidad (hasta 60 % de mezcla con nubosidad total).
- Lluvia (precipitación > 0 o código de lluvia/tormenta): baja saturación y luminosidad un paso más.
- Capas del diseño: degradé principal + bruma baja + nube difusa (su opacidad sube con la nubosidad) + grano fijo (SVG `feTurbulence`, opacidad baja).

### Contraste automático
- Los textos mantienen la posición del diseño; **su color se calcula según el fondo que tienen detrás**: header → color de arriba, centro → color del medio, regla y pie → color de abajo.
- Para cada zona se elige tinta clara (blanco) o tinta oscura (índigo muy oscuro), la que dé mayor contraste.
- Los textos secundarios usan la misma tinta con transparencia; la transparencia se ajusta para que el color resultante (mezclado con el fondo) cumpla **4.5:1** (texto chico) o **3:1** (texto ≥ 24 px). Esto corrige los textos del pie, que en el diseño tienen poco contraste.

### Cómo se aplica
- `<Sky>` vive en `layout.tsx`, así no se desmonta al cambiar de ciudad y la transición de color es continua.
- `<Ventana>` escribe los colores como variables CSS (`--sky-top`, `--sky-mid`, `--sky-bottom`, `--ink-top`…) en el documento.
- Las variables se registran con `@property` (tipo `<color>`), lo que permite que CSS las anime con `transition`.

## 7. Componentes y comportamiento

### Header
- Izquierda: nombre de la ciudad (abre el buscador) · hora local real (se actualiza cada minuto) + abreviatura de zona.
- Derecha: indicador de estado · °C/°F · botón de búsqueda · marca "VENTANA". El botón de ajustes no va en v1.
- Indicador de estado: "EN VIVO" cuando la regla está en el momento actual; "PRONÓSTICO" si está en el futuro y "MÁS TEMPRANO" si está en el pasado. Clic en el indicador → vuelve al momento actual.

### Arco del sol
- Muestra el día local que contiene el momento elegido: alba y ocaso con sus horas.
- El punto del sol se ubica según la fracción del día transcurrida; de noche no se muestra.

### Temperatura y datos
- Número monumental: temperatura del momento elegido (actual si es "EN VIVO"; si no, la de la hora más cercana). Al cambiar, el número transiciona con Motion.
- Debajo: condición (código WMO → texto) y sensación térmica.
- Fila de datos: viento (km/h + punto cardinal), humedad, probabilidad de precipitación, presión.
- °C/°F: cambia solo las temperaturas (el viento sigue en km/h). La preferencia se guarda en una **cookie** que lee el servidor, para que la página llegue ya con la unidad correcta (sin parpadeo).

### Regla de 24 horas
- Por debajo hay un `<input type="range">` nativo (invisible), con el diseño de la regla dibujado encima. Así el teclado (flechas, Inicio/Fin) y los lectores de pantalla funcionan sin código extra. `aria-valuetext` anuncia la hora y la temperatura, ej. "23:00, 12 grados".
- Valor continuo (minutos), desde el primer hasta el último punto de la ventana. Se mueve:
  - arrastrando la regla;
  - con la rueda del mouse o el trackpad en cualquier parte de la pantalla (no hay scroll de página: es una vista única);
  - con el teclado.
- Etiquetas: temperatura arriba y hora abajo en cada hora; en mobile (< 768 px) las etiquetas se muestran cada 3 horas y las marcas, todas.

### Buscador
- Se abre con el nombre de la ciudad, el botón de lupa o la tecla `/`. Se cierra con `Esc` o tocando afuera.
- El cielo se desenfoca y oscurece; el input grande va flotando sobre el cielo (sin caja de modal), como en el diseño.
- Sugerencias: espera 300 ms después de la última tecla, mínimo 2 caracteres, hasta 5 resultados ("Ciudad, Provincia, País"; ej. Buenos Aires aparece en Argentina y en Nicaragua). Patrón ARIA *combobox*: flechas para moverse, Enter para elegir.
- Elegir una ciudad → navega a `/{slug}-{id}`.
- "Usar mi ubicación": pide permiso al navegador → navega a `/?lat&lon`. Si se niega o falla, muestra el motivo dentro del buscador.

### Pie
- Mismas posiciones que el diseño: hora de la última actualización · lugar y coordenadas · visibilidad.

## 8. Animación y movimiento

| Qué | Cómo | Duración aprox. |
|---|---|---|
| Cielo (cambio de hora o de ciudad) | `transition` de variables `@property` | 600 ms |
| Número de temperatura | Motion (salida/entrada vertical) | 300 ms |
| Buscador abrir/cerrar | Motion `AnimatePresence` + desenfoque del fondo | 250 ms |
| Arrastre de la regla | Sin transición (sigue al puntero en tiempo real) | — |

Con "reducir movimiento" activado en el sistema (`prefers-reduced-motion`), las transiciones pasan a cambios inmediatos (`MotionConfig reducedMotion="user"` + media query en CSS).

## 9. Errores

| Situación | Qué ve la persona |
|---|---|
| Id de ciudad inexistente | `not-found.tsx` con el mismo estilo + buscador |
| Open-Meteo caído o respuesta inválida | `error.tsx`: mensaje claro + botón "Reintentar" |
| Búsqueda sin resultados | "No encontramos esa ciudad" en el buscador |
| Falla del endpoint de búsqueda | "No pudimos buscar ahora" en el buscador (sin romper la pantalla) |
| Permiso de ubicación denegado o no disponible | Mensaje dentro del buscador; la ciudad actual sigue igual |
| `lat`/`lon` inválidas en la URL | Redirige a `/` |

## 10. Tipografía y colores del diseño

- Display (ciudad, marca, número): serif de alto contraste; datos: sans geométrica. Los nombres exactos, tamaños y colores se toman de Figma (`get_design_context` sobre `1:274`) al empezar la maqueta y se cargan con `next/font`. Si alguna fuente no está en Google Fonts, se elige la alternativa más cercana y se consulta.
- La paleta "hora dorada" (§6) se calibra con los colores del degradé del diseño.

## 11. Calidad

### Tests unitarios (Vitest)
- Paletas: interpolación entre momentos, efecto de nubes y lluvia.
- Contraste: la tinta elegida y la transparencia cumplen los mínimos.
- Tiempo: formato en la zona horaria de la ciudad, punto horario más cercano, ventana de 24 h.
- Unidades (°C → °F), punto cardinal del viento, tabla de códigos WMO.
- Normalización: respuesta de Open-Meteo (fixture JSON) → `Forecast`; respuesta inválida → error.
- Slug: `/{slug}-{id}` se arma y se interpreta bien (acentos, espacios).

### Test de punta a punta (Playwright)
- Entra a `/`, ve una temperatura, mueve la regla con el teclado y el estado pasa a "PRONÓSTICO", busca "Córdoba", elige un resultado y la URL cambia.
- Usa la API real (es un smoke test: verifica estructura, no valores).

### CI y deploy
- GitHub Actions en cada PR: lint, chequeo de tipos, tests unitarios, build y e2e.
- Vercel conectado al repo: preview por PR y producción desde `main`. La conexión inicial requiere iniciar sesión en Vercel con la cuenta del proyecto (paso manual).

## 12. Forma de trabajo

- Claude escribe el código. Al cerrar cada bloque: explicación de los puntos clave (con notas "en JS esto sería…" para TypeScript y notas de back cuando aparece código de servidor) + mini cuestionario multiple choice sobre lógica, arquitectura y funciones clave.
- Cada bloque = una rama + PR. Cada merge a `main` se avisa.
- El plan de implementación (bloques y orden) se escribe aparte, después de aprobar esta especificación.

## 13. Decisiones registradas

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Cielo con degradés CSS | Shader WebGL | Más liviano y explicable; alcanza para el diseño |
| Datos en el servidor | Fetch desde el navegador | Pantalla completa sin "cargando…", caché compartida, validación central |
| Endpoint propio de búsqueda | Llamar a Open-Meteo desde el navegador | Normalizar/validar en un lugar y aprender cómo se arma un endpoint |
| `input range` nativo bajo la regla | Slider 100 % custom | Accesibilidad y teclado sin reinventar |
| Ubicación por botón | Pedir permiso al entrar | Mejor UX: el permiso se pide con contexto |
| URL `/{slug}-{id}` | Solo nombre | Evita ciudades homónimas |
| Unidad en cookie | `localStorage` | El servidor la conoce: sin parpadeo ni desajustes de hidratación |
| Open-Meteo | OpenWeather | Gratis, sin API key, datos horarios y de sol en un solo pedido |
