"use client";

import { useEffect, useState } from "react";
import { formatTime } from "@/lib/time";

type LocalClockProps = { timeZone: string; locale: string; initial: number };

export function LocalClock({ timeZone, locale, initial }: LocalClockProps) {
  const [now, setNow] = useState(initial);

  useEffect(() => {
    // Ticks right away (initial may be minutes old), then at each minute boundary.
    let timer = setTimeout(function tick() {
      const ms = Date.now();
      setNow(Math.floor(ms / 1000));
      timer = setTimeout(tick, 60_000 - (ms % 60_000));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <time
      dateTime={new Date(now * 1000).toISOString()}
      suppressHydrationWarning
    >
      {formatTime(now, timeZone, locale)}
    </time>
  );
}
