import { useEffect, useState } from "react";

// The device's time in unix seconds. It starts at `initial` (what the server
// rendered, so hydration matches), then follows the clock on each minute boundary.
export function useNow(initial: number): number {
  const [now, setNow] = useState(initial);

  useEffect(() => {
    let timer = setTimeout(function tick() {
      const ms = Date.now();
      setNow(Math.floor(ms / 1000));
      timer = setTimeout(tick, 60_000 - (ms % 60_000));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return now;
}
