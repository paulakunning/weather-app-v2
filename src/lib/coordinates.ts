export function parseCoordinates(
  lat: string | undefined,
  lon: string | undefined,
): { latitude: number; longitude: number } | null {
  // Number("") and Number(" ") are 0, so blank values must be rejected first.
  if (!lat?.trim() || !lon?.trim()) return null;
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

export type Hemispheres = { N: string; S: string; E: string; W: string };

// toFixed rounds the binary value: (34.61315).toFixed(4) is "34.6131".
function fourDecimals(value: number): string {
  return (Math.round(Math.abs(value) * 1e4) / 1e4).toFixed(4);
}

export function formatCoordinates(
  latitude: number,
  longitude: number,
  hemispheres: Hemispheres,
): string {
  const ns = latitude < 0 ? hemispheres.S : hemispheres.N;
  const ew = longitude < 0 ? hemispheres.W : hemispheres.E;
  return `${fourDecimals(latitude)}° ${ns}, ${fourDecimals(longitude)}° ${ew}`;
}
