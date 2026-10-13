import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useNow } from "./use-now";

afterEach(() => {
  vi.useRealTimers();
});

it("starts at the initial time, then follows the device clock each minute", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  vi.setSystemTime(new Date("2026-10-13T03:33:20Z"));
  const { result } = renderHook(() => useNow(1000));
  expect(result.current).toBe(1000);

  await act(async () => vi.advanceTimersByTime(0));
  expect(result.current).toBe(Date.parse("2026-10-13T03:33:20Z") / 1000);

  await act(async () => vi.advanceTimersByTime(40_000));
  expect(result.current).toBe(Date.parse("2026-10-13T03:34:00Z") / 1000);
});
