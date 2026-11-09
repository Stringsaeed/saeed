"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { findBuiltInApp } from "@/data/apps";
import type { BlogPost } from "@/lib/content";
import { formatPostDate } from "@/lib/format-date";
import { AppIcon } from "./app-icon";
import { useClock } from "./status-bar";

// Press the side button and the phone locks: a clock, the date, and the
// latest posts as notifications. Any press, Enter, or a swipe up unlocks.

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
});
const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function LockScreen({
  locked,
  onUnlock,
  posts,
}: {
  locked: boolean;
  onUnlock: () => void;
  posts: readonly BlogPost[];
}) {
  const now = useClock(5_000);
  const reduced = useReducedMotion();
  const writing = findBuiltInApp("writing");

  useEffect(() => {
    if (!locked) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape" || event.key === " ")
        onUnlock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    locked,
    onUnlock,
  ]);

  return (
    <AnimatePresence>
      {locked ? (
        <motion.div
          className="os-lock"
          role="dialog"
          aria-label="Lock screen"
          initial={
            reduced
              ? {
                  opacity: 0,
                }
              : {
                  opacity: 0,
                  scale: 1.04,
                }
          }
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={
            reduced
              ? {
                  opacity: 0,
                }
              : {
                  opacity: 0,
                  y: "-100%",
                }
          }
          transition={{
            type: "spring",
            duration: 0.5,
            bounce: 0,
          }}
          drag={reduced ? false : "y"}
          dragConstraints={{
            top: 0,
            bottom: 0,
          }}
          dragElastic={{
            top: 0.6,
            bottom: 0.05,
          }}
          onDragEnd={(_, info) => {
            if (info.offset.y < -60 || info.velocity.y < -400) onUnlock();
          }}
          onClick={onUnlock}
          style={{
            background:
              "linear-gradient(180deg, rgb(0 0 0 / 0.25), rgb(0 0 0 / 0.05) 40%, rgb(0 0 0 / 0.3))",
          }}
        >
          <div className="os-lock-date" suppressHydrationWarning>
            {now ? dateFormat.format(now) : ""}
          </div>
          <div className="os-lock-time" suppressHydrationWarning>
            {now ? timeFormat.format(now) : "9:41"}
          </div>
          <div className="os-lock-signature">Saeed</div>

          <ul className="os-notifications" aria-label="Notifications">
            {posts.slice(0, 2).map((post) => (
              <li key={post.slug}>
                <Link
                  className="os-notification"
                  href={`/blog/${post.slug}`}
                  onClick={(event) => event.stopPropagation()}
                  data-sound="tap"
                  data-analytics-event="Blog Post Clicked"
                  data-analytics-slug={post.slug}
                  data-analytics-location="Lock Screen"
                >
                  <AppIcon app={writing} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="os-notification-head">
                      <span>Writing</span>
                      <span>{formatPostDate(post.date)}</span>
                    </span>
                    <span className="os-notification-title line-clamp-2">
                      {post.title}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="os-lock-hint">Press anywhere to unlock</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
