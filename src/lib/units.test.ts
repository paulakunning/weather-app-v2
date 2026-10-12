import { describe, expect, test } from "vitest";
import { compassPoint, parseUnit, toUnit } from "./units";

describe("toUnit", () => {
  test("rounds Celsius and converts to Fahrenheit", () => {
    expect(toUnit(14, "c")).toBe(14);
    expect(toUnit(14, "f")).toBe(57);
    expect(toUnit(-40, "f")).toBe(-40);
  });

  test("never returns -0", () => {
    const result = toUnit(-0.4, "c");
    expect(result).toBe(0);
    expect(Object.is(result, -0)).toBe(false);
  });
});

test("parseUnit only accepts 'f' as Fahrenheit", () => {
  expect(parseUnit("f")).toBe("f");
  expect(parseUnit("x")).toBe("c");
  expect(parseUnit(undefined)).toBe("c");
});

test("compassPoint uses 8 centered sectors", () => {
  expect(compassPoint(0)).toBe("N");
  expect(compassPoint(22.4)).toBe("N");
  expect(compassPoint(22.5)).toBe("NE");
  expect(compassPoint(169)).toBe("S");
  expect(compassPoint(350)).toBe("N");
  expect(compassPoint(360)).toBe("N");
  expect(compassPoint(-45)).toBe("NW");
});
