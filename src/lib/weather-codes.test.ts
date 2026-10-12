import { expect, test } from "vitest";
import { conditionFromCode, isRainy } from "./weather-codes";

test("conditionFromCode maps WMO codes, unknown otherwise", () => {
  expect(conditionFromCode(2)).toBe("partlyCloudy");
  expect(conditionFromCode(99)).toBe("thunderstormHail");
  expect(conditionFromCode(42)).toBe("unknown");
});

test("isRainy covers showers but not snow", () => {
  expect(isRainy("rainShowers")).toBe(true);
  expect(isRainy("snow")).toBe(false);
});
