"use client";

import { useNow } from "@/lib/hooks/use-now";
import { formatTime } from "@/lib/time";

type LocalClockProps = { timeZone: string; locale: string; initial: number };

export function LocalClock({ timeZone, locale, initial }: LocalClockProps) {
  const now = useNow(initial);

  return (
    <time
      dateTime={new Date(now * 1000).toISOString()}
      suppressHydrationWarning
    >
      {formatTime(now, timeZone, locale)}
    </time>
  );
}
