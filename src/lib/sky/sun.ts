import { getPosition } from "suncalc";

/** Apparent sun altitude in degrees (suncalc 2 already returns degrees). */
export function sunAltitude(
  unix: number,
  latitude: number,
  longitude: number,
): number {
  return getPosition(new Date(unix * 1000), latitude, longitude).altitude;
}
