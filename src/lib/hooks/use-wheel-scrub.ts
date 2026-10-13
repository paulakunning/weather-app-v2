import { useEffect } from "react";

type WheelScrub = { enabled: boolean; onDelta: (seconds: number) => void };

// The page never scrolls, so the wheel anywhere moves the time: 100 px (one notch) = 1 hour.
export function useWheelScrub({ enabled, onDelta }: WheelScrub): void {
  useEffect(() => {
    if (!enabled) return;
    const onWheel = (event: WheelEvent) =>
      onDelta(Math.round(event.deltaY * 36));
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [enabled, onDelta]);
}
