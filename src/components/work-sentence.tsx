"use client";

import {
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { WORK } from "@/data/work";
import { cn } from "@/lib/utils";

// Where I have worked, as one sentence. Point at a name, or reach it with the
// keyboard, and the line under the sentence says when and what. A finger has
// no hover, so its first press on a name shows the line and the second goes
// to the company; the line has its own link too.

const IDLE = "Press or point at a name for the years and what I did there.";

export function WorkSentence({
  className,
  linkClassName,
  children,
}: {
  className?: string;
  /** The underline the page gives every link in its sentences. */
  linkClassName: string;
  /** Said after the list, in the same sentence: the latest post. */
  children?: ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const touch = useRef(false);
  const item = WORK.find((entry) => entry.company === active);

  const onPointerDown = useCallback((event: PointerEvent) => {
    touch.current = event.pointerType !== "mouse";
  }, []);

  const onPointerEnter = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      if (event.pointerType !== "mouse") return;
      setActive(event.currentTarget.dataset.company ?? null);
    },
    [],
  );

  const onFocus = useCallback((event: FocusEvent<HTMLAnchorElement>) => {
    // Only the keyboard: a press focuses the link too, and is handled on
    // click.
    if (!event.currentTarget.matches(":focus-visible")) return;
    setActive(event.currentTarget.dataset.company ?? null);
  }, []);

  const onClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      const company = event.currentTarget.dataset.company ?? null;
      if (!touch.current || active === company) return;
      event.preventDefault();
      setActive(company);
    },
    [
      active,
    ],
  );

  const onPointerLeave = useCallback((event: PointerEvent) => {
    if (event.pointerType === "mouse") setActive(null);
  }, []);

  const onBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    if (!touch.current) setActive(null);
  }, []);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: leaving the sentence, by pointer or focus, clears the line under it; the links are the controls.
    <div
      className={className}
      onPointerLeave={onPointerLeave}
      onBlur={onBlur}
      data-analytics-view="Content Viewed"
      data-analytics-label="Work"
    >
      <p className="backdrop-plate text-base leading-7">
        Previously at{" "}
        {WORK.map((entry, index) => (
          <span key={entry.company}>
            <a
              className={cn(
                linkClassName,
                "data-active:decoration-2 data-active:decoration-[color-mix(in_oklab,var(--brand)_70%,var(--foreground))]",
              )}
              style={
                {
                  "--brand": entry.brand,
                } as CSSProperties
              }
              href={entry.href}
              target="_blank"
              rel="noreferrer"
              data-company={entry.company}
              data-active={active === entry.company || undefined}
              // Counted only when it goes somewhere: a first press on a
              // touch screen shows the line, and is not a visit.
              data-analytics-event={
                active === entry.company ? "Work Link Clicked" : undefined
              }
              data-analytics-company={entry.company}
              data-analytics-location="Home"
              data-sound="tap"
              data-sound-hover="hover"
              onPointerDown={onPointerDown}
              onPointerEnter={onPointerEnter}
              onFocus={onFocus}
              onClick={onClick}
            >
              {entry.company}
            </a>
            {index < WORK.length - 2
              ? ", "
              : index === WORK.length - 2
                ? ", and "
                : "."}
          </span>
        ))}
        {children}
      </p>
      {/* Room is kept for the longest line, two lines or three on a narrow
          phone, so the page does not move when it changes. */}
      <p
        className="backdrop-plate mt-2 min-h-15 text-[13px] sm:min-h-10 leading-5 text-muted-foreground"
        aria-live="polite"
      >
        {item ? (
          <>
            {/* biome-ignore lint/performance/noImgElement: a 16px logo beside a line of text; next/image would add a request per logo for nothing. */}
            <img
              src={item.logo}
              alt=""
              width={16}
              height={16}
              className="mr-1.5 inline-block size-4 rounded-full align-[-3px] grayscale"
            />
            <span className="font-mono text-xs text-foreground tabular-nums">
              {item.period}
            </span>
            {" · "}
            {item.description}{" "}
            <a
              className="relative whitespace-nowrap text-foreground underline decoration-foreground/30 underline-offset-[3px] after:absolute after:-inset-x-1 after:-inset-y-3 hover:decoration-foreground/70"
              href={item.href}
              target="_blank"
              rel="noreferrer"
              data-analytics-event="Work Link Clicked"
              data-analytics-company={item.company}
              data-analytics-location="Home"
              data-sound="tap"
              aria-label={`Visit ${item.company}`}
            >
              Visit ↗
            </a>
          </>
        ) : (
          IDLE
        )}
      </p>
    </div>
  );
}
