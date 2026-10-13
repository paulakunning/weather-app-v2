import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { Rain } from "./Rain";

function drops() {
  const { container, unmount } = render(<Rain />);
  const styles = [...container.querySelectorAll<HTMLElement>("span")].map(
    (drop) => drop.getAttribute("style") ?? "",
  );
  unmount();
  return styles;
}

it("draws the same drops on every render, so server and client agree", () => {
  expect(drops()).toEqual(drops());
});

it("gives each drop its own speed, length and start, so they never fall in sync", () => {
  const styles = drops();
  const distinct = (property: string) =>
    new Set(
      styles.map(
        (style) => style.match(new RegExp(`${property}: ([^;]+)`))?.[1],
      ),
    ).size;

  expect(styles.length).toBeGreaterThanOrEqual(50);
  expect(distinct("animation-duration")).toBeGreaterThan(styles.length * 0.8);
  expect(distinct("animation-delay")).toBeGreaterThan(styles.length * 0.8);
  expect(distinct("height")).toBeGreaterThan(styles.length * 0.5);
});
