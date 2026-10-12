import { describe, expect, test } from "vitest";
import { parsePlaceParam, placePath, slugify } from "./slug";

test("slugify strips diacritics and collapses separators", () => {
  expect(slugify("Córdoba")).toBe("cordoba");
  expect(slugify("São Paulo")).toBe("sao-paulo");
  expect(slugify("  Buenos   Aires ")).toBe("buenos-aires");
});

test("placePath falls back to 'city' for names with no Latin letters", () => {
  expect(placePath("北京", 1816670)).toBe("city-1816670");
});

describe("parsePlaceParam", () => {
  test("splits slug and id", () => {
    expect(parsePlaceParam("buenos-aires-3435910")).toEqual({
      slug: "buenos-aires",
      id: 3435910,
    });
    expect(parsePlaceParam("3435910")).toEqual({ slug: "", id: 3435910 });
  });

  test("rejects params without a positive id", () => {
    expect(parsePlaceParam("buenos-aires")).toBeNull();
    expect(parsePlaceParam("x-0")).toBeNull();
    expect(parsePlaceParam("")).toBeNull();
  });
});
