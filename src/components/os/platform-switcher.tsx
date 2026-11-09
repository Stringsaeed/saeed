"use client";

import { RiAndroidFill, RiAppleFill, RiGlobalLine } from "@remixicon/react";
import { motion } from "framer-motion";
import { useId } from "react";
import { playSound } from "@/lib/sound";
import { spring } from "@/lib/springs";
import {
  PLATFORM_LABELS,
  PLATFORMS,
  type Platform,
  usePlatform,
} from "./platform";

const icons = {
  ios: RiAppleFill,
  android: RiAndroidFill,
  web: RiGlobalLine,
} satisfies Record<Platform, unknown>;

// One codebase, three platforms: the same control a React Native engineer
// reaches for a hundred times a day, pointed at the site itself.
export function PlatformSwitcher({
  className,
  location,
}: {
  className?: string;
  location: string;
}) {
  const { platform, setPlatform } = usePlatform();
  const layoutId = useId();
  return (
    <div
      className={["os-segmented", className].filter(Boolean).join(" ")}
      role="radiogroup"
      aria-label="Platform"
    >
      {PLATFORMS.map((value) => {
        const Icon = icons[value];
        const checked = platform === value;
        return (
          // biome-ignore lint/a11y/useSemanticElements: the thumb animates between buttons; a radio input cannot host it.
          <button
            key={value}
            type="button"
            role="radio"
            className="os-segment"
            aria-checked={checked}
            onClick={() => {
              if (checked) return;
              playSound("select");
              setPlatform(value);
            }}
            data-analytics-event="Platform Changed"
            data-analytics-label={PLATFORM_LABELS[value]}
            data-analytics-location={location}
          >
            {checked ? (
              <motion.span
                className="os-segment-thumb"
                layoutId={layoutId}
                transition={spring.moderate}
                aria-hidden="true"
              />
            ) : null}
            <span className="relative z-[1] inline-flex items-center gap-1.5">
              <Icon className="size-4" aria-hidden="true" />
              {PLATFORM_LABELS[value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
