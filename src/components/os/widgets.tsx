"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { findBuiltInApp } from "@/data/apps";
import { roles } from "@/data/work";
import type { BlogPost } from "@/lib/content";
import { formatPostDate } from "@/lib/format-date";
import { AppIcon } from "./app-icon";
import { useClock } from "./status-bar";

// Home-screen widgets. Each is a link dressed as a frosted tile with the
// app's name under it, like the real thing.

function Widget({
  href,
  label,
  size = "small",
  children,
  analytics,
  transitionTypes = [
    "app-open",
  ],
}: {
  href: string;
  label: string;
  size?: "small" | "medium";
  children: ReactNode;
  analytics: string;
  transitionTypes?: string[];
}) {
  return (
    <Link
      className="os-widget"
      data-size={size}
      href={href}
      transitionTypes={transitionTypes}
      aria-label={label}
      data-sound="tap"
      data-analytics-event="Widget Clicked"
      data-analytics-label={analytics}
    >
      <span className="os-widget-body">{children}</span>
      <span className="os-app-label" aria-hidden="true">
        {label}
      </span>
    </Link>
  );
}

export function AboutWidget() {
  const me = findBuiltInApp("me");
  return (
    <Widget href={me.href} label="Me" size="medium" analytics="About">
      <span className="flex h-full items-center gap-4">
        <span className="relative size-[68px] shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
          <Image
            src="/static/color.svg"
            alt=""
            width={68}
            height={68}
            unoptimized
            priority
          />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[13px] font-medium text-[color:var(--os-widget-fg-2)]">
            Hi, I’m
          </span>
          <span className="saeed-name mt-3 block text-[36px] leading-none">
            Saeed
          </span>
          <span className="mt-4 text-[13px] leading-[1.3] text-[color:var(--os-widget-fg-2)]">
            Senior software engineer. React Native, Swift, Kotlin. Dubai.
          </span>
        </span>
      </span>
    </Widget>
  );
}

const dubaiTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Dubai",
});
const dubaiDay = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Dubai",
});

function offsetFromVisitor(now: Date) {
  const dubai = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Dubai",
    }),
  );
  const local = new Date(now.toLocaleString("en-US"));
  const hours = Math.round((dubai.getTime() - local.getTime()) / 36e5);
  if (hours === 0) return "Same time as you";
  const abs = Math.abs(hours);
  return `${abs}h ${hours > 0 ? "ahead of" : "behind"} you`;
}

export function ClockWidget() {
  const now = useClock(5_000);
  const me = findBuiltInApp("me");
  return (
    <Widget href={me.href} label="Dubai" analytics="Clock">
      <span className="flex h-full flex-col">
        <span className="os-widget-kicker">Dubai</span>
        <span
          className="mt-auto text-[40px] leading-none font-semibold tracking-[-0.04em] tabular-nums"
          suppressHydrationWarning
        >
          {now ? dubaiTime.format(now) : "––:––"}
        </span>
        <span
          className="mt-2 text-[12px] leading-[1.3] text-[color:var(--os-widget-fg-2)]"
          suppressHydrationWarning
        >
          {now ? (
            <>
              {dubaiDay.format(now)}
              <br />
              {offsetFromVisitor(now)}
            </>
          ) : (
            "Gulf Standard Time"
          )}
        </span>
      </span>
    </Widget>
  );
}

export function WritingWidget({ post }: { post: BlogPost | undefined }) {
  const writing = findBuiltInApp("writing");
  return (
    <Widget
      href={post ? `/blog/${post.slug}` : writing.href}
      label="Writing"
      analytics="Latest Post"
    >
      <span className="flex h-full flex-col">
        <span className="os-widget-kicker">
          <AppIcon app={writing} size={16} />
          Latest
        </span>
        <span className="mt-2 line-clamp-4 text-[15px] leading-[1.25] font-semibold tracking-[-0.01em]">
          {post?.title ?? "Notes on React Native and agents."}
        </span>
        {post ? (
          <span className="mt-auto text-[12px] text-[color:var(--os-widget-fg-2)]">
            {formatPostDate(post.date)}
          </span>
        ) : null}
      </span>
    </Widget>
  );
}

const logoRoles = roles.filter((role) => role.logo);

export function ShippedWidget() {
  const work = findBuiltInApp("work");
  return (
    <Widget href={work.href} label="Work" size="medium" analytics="Shipped">
      <span className="flex h-full flex-col justify-between">
        <span className="os-widget-kicker">
          <AppIcon app={work} size={16} />
          Shipped at work
        </span>
        <span className="text-[17px] leading-[1.25] font-semibold tracking-[-0.015em]">
          Apps that are already on a few million phones in Egypt and the Gulf.
        </span>
        <span className="flex items-center gap-2">
          {logoRoles.map((role) => (
            <span
              key={role.company}
              className="relative size-7 overflow-hidden rounded-full bg-white ring-1 ring-black/10"
              title={role.company}
            >
              <Image
                src={role.logo as string}
                alt={role.company}
                width={28}
                height={28}
                sizes="28px"
              />
            </span>
          ))}
          <span className="ml-1 text-[12px] text-[color:var(--os-widget-fg-2)]">
            2022 to now
          </span>
        </span>
      </span>
    </Widget>
  );
}

export function SideProjectsWidget() {
  const projects = findBuiltInApp("projects");
  return (
    <Widget
      href={projects.href}
      label="Apps"
      size="medium"
      analytics="Side Projects"
    >
      <span className="flex h-full flex-col justify-between">
        <span className="os-widget-kicker">
          <AppIcon app={projects} size={16} />
          Nights and weekends
        </span>
        <span className="text-[17px] leading-[1.25] font-semibold tracking-[-0.015em]">
          A money app, a Battleship on Durable Objects, a WebGPU shooter, a
          Rust clipboard manager.
        </span>
        <span className="text-[12px] text-[color:var(--os-widget-fg-2)]">
          All open source.
        </span>
      </span>
    </Widget>
  );
}
