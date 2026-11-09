"use client";

import { useEffect, useState } from "react";

// The strip along the top of the screen: the time, and the glyphs every
// phone shows whether they mean anything or not. Only drawn inside the
// desktop frame; a real phone has its own.

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(/\s?[AP]M$/i, "");
}

export function useClock(intervalMs = 15_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [
    intervalMs,
  ]);
  return now;
}

export function StatusBar() {
  const now = useClock();
  // 9:41 until the client knows the time: every keynote's clock.
  const time = now ? formatTime(now) : "9:41";
  return (
    <div className="os-status" aria-hidden="true">
      <span suppressHydrationWarning>{time}</span>
      <span className="os-status-glyphs">
        <svg width="18" height="12" viewBox="0 0 18 12">
          <title>Signal</title>
          <rect x="0" y="8" width="3" height="4" rx="0.8" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
          <rect x="10" y="3" width="3" height="9" rx="0.8" />
          <rect x="15" y="0" width="3" height="12" rx="0.8" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12">
          <title>Wi-Fi</title>
          <path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.3-1.4A10.6 10.6 0 0 0 8 .6 10.6 10.6 0 0 0 .7 3.6L2 5a8.7 8.7 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.3-1.4A7.2 7.2 0 0 0 8 4.1a7.2 7.2 0 0 0-4.9 1.9L4.4 7.4A5.3 5.3 0 0 1 8 6Zm0 3.4c.6 0 1.1.2 1.5.6L8 11.5 6.5 10a2.1 2.1 0 0 1 1.5-.6Z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <title>Battery</title>
          <rect
            x="0.5"
            y="0.5"
            width="23"
            height="12"
            rx="3.5"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.4"
          />
          <rect x="2" y="2" width="18" height="9" rx="2" />
          <path d="M25 4.5v4a2 2 0 0 0 0-4Z" fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  );
}
