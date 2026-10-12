import { expect, test } from "vitest";
import { sunAltitude } from "./sun";

test("sunAltitude returns degrees: high at Buenos Aires noon, low at midnight", () => {
  // 12:40 and 00:00 in Buenos Aires; upper/lower bounds catch a radians mix-up.
  const noon = sunAltitude(
    Date.UTC(2026, 9, 11, 15, 40) / 1000,
    -34.61,
    -58.38,
  );
  expect(noon).toBeGreaterThan(55);
  expect(noon).toBeLessThan(70);

  const midnight = sunAltitude(
    Date.UTC(2026, 9, 11, 3, 0) / 1000,
    -34.61,
    -58.38,
  );
  expect(midnight).toBeLessThan(-40);
  expect(midnight).toBeGreaterThan(-90);
});
