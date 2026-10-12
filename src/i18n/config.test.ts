import { describe, expect, test } from "vitest";
import { isLocale, matchLocale } from "./config";

describe("matchLocale", () => {
  test("picks the highest-q supported language", () => {
    expect(matchLocale("es-AR,es;q=0.9,en;q=0.8", undefined)).toBe("es");
    expect(matchLocale("en-US,en;q=0.9,es;q=0.8", undefined)).toBe("en");
    expect(matchLocale("fr;q=0.9, es;q=0.8", undefined)).toBe("es");
  });

  test("falls back to English", () => {
    expect(matchLocale("fr-FR,fr;q=0.9", undefined)).toBe("en");
    expect(matchLocale("es;q=0", undefined)).toBe("en");
    expect(matchLocale(null, undefined)).toBe("en");
    expect(matchLocale("*", undefined)).toBe("en");
  });

  test("a valid cookie wins, an invalid one is ignored", () => {
    expect(matchLocale("en", "es")).toBe("es");
    expect(matchLocale("es", "fr")).toBe("es");
  });
});

test("isLocale accepts only supported locales", () => {
  expect(isLocale("es")).toBe(true);
  expect(isLocale("fr")).toBe(false);
});
