"use client";

import { useEffect, useState } from "react";

// The time where I am, to the second. The server cannot know the visitor's
// clock, so the first paint holds the place with dashes of the same width
// and the time arrives after hydration.
const format = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dubai",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function LocalClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    // Ticks on the second, so it turns over with the system clock.
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(
      () => {
        setNow(new Date());
        interval = setInterval(() => setNow(new Date()), 1000);
      },
      1000 - (Date.now() % 1000),
    );
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <time
      className={className}
      dateTime={now?.toISOString()}
      suppressHydrationWarning
    >
      {now ? format.format(now) : "--:--:--"} GST
    </time>
  );
}
