import { describe, expect, test } from "vitest";
import { formatCoordinates, parseCoordinates } from "./coordinates";

describe("parseCoordinates", () => {
  test("parses valid latitude and longitude", () => {
    expect(parseCoordinates("-34.6", "-58.38")).toEqual({
      latitude: -34.6,
      longitude: -58.38,
    });
  });

  test("rejects out-of-range, non-numeric or missing values", () => {
    expect(parseCoordinates("91", "0")).toBeNull();
    expect(parseCoordinates("0", "181")).toBeNull();
    expect(parseCoordinates("abc", "0")).toBeNull();
    expect(parseCoordinates(" ", "0")).toBeNull();
    expect(parseCoordinates(undefined, "0")).toBeNull();
  });
});

test("formatCoordinates uses 4 decimals and hemisphere letters", () => {
  expect(
    formatCoordinates(-34.61315, -58.37723, { N: "N", S: "S", E: "E", W: "O" }),
  ).toBe("34.6132° S, 58.3772° O");
});
