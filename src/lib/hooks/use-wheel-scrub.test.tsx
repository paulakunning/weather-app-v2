import { renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useWheelScrub } from "./use-wheel-scrub";

const wheel = (deltaY: number) =>
  window.dispatchEvent(new WheelEvent("wheel", { deltaY }));

it("turns one wheel notch (100 px) into one hour", () => {
  const onDelta = vi.fn();
  renderHook(() => useWheelScrub({ enabled: true, onDelta }));
  wheel(100);
  expect(onDelta).toHaveBeenCalledWith(3600);
});

it("does nothing while disabled", () => {
  const onDelta = vi.fn();
  renderHook(() => useWheelScrub({ enabled: false, onDelta }));
  wheel(100);
  expect(onDelta).not.toHaveBeenCalled();
});

it("stops listening after unmount", () => {
  const onDelta = vi.fn();
  const { unmount } = renderHook(() =>
    useWheelScrub({ enabled: true, onDelta }),
  );
  unmount();
  wheel(100);
  expect(onDelta).not.toHaveBeenCalled();
});
