"use client";

import {
  RiArticleLine,
  RiAtLine,
  RiBlueskyFill,
  RiCloseLine,
  RiDownloadLine,
  RiGithubFill,
  RiLinkedinFill,
  RiLinksLine,
  RiMailLine,
  RiPhoneLine,
  RiTwitterXFill,
} from "@remixicon/react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  type FocusEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";
import { AnimatedAvatar } from "./animated-avatar";
import { SaeedName } from "./saeed-name";
import { SoundToggle } from "./sound-toggle";
import { ThemeSwitcher } from "./theme-switcher-trigger";
import { Button } from "./ui/button";

const socialLinks = [
  {
    label: "Email",
    href: "mailto:stringsaeed@gmail.com",
    icon: RiMailLine,
  },
  {
    label: "Phone",
    href: "tel:+18578678243",
    icon: RiPhoneLine,
  },
  {
    label: "GitHub",
    href: "https://github.com/stringsaeed",
    icon: RiGithubFill,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/stringsaeed",
    icon: RiLinkedinFill,
  },
  {
    label: "X",
    href: "https://x.com/stringsaeed",
    icon: RiTwitterXFill,
  },
  {
    label: "Bluesky",
    href: "https://bsky.app/profile/saeed.guru",
    icon: RiBlueskyFill,
  },
];

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-3 py-6">
      <Link
        className="flex shrink-0 items-center gap-3"
        href="/"
        data-analytics-event="Navigation Clicked"
        data-analytics-destination="Home"
        data-analytics-location="Header"
        data-sound="tap"
      >
        <AnimatedAvatar />
        <SaeedName className="signature-name" />
      </Link>

      <nav className="ml-auto flex items-center gap-1" aria-label="Site links">
        <Button asChild variant="ghost" leadingIcon={RiArticleLine}>
          <Link
            href="/blog"
            data-analytics-event="Navigation Clicked"
            data-analytics-destination="Blog"
            data-analytics-location="Header"
            data-sound="tap"
          >
            Blog
          </Link>
        </Button>
        <Button asChild variant="ghost" leadingIcon={RiLinksLine}>
          <Link
            href="/links"
            data-analytics-event="Navigation Clicked"
            data-analytics-destination="Links"
            data-analytics-location="Header"
            data-sound="tap"
          >
            Links
          </Link>
        </Button>
        <ThemeSwitcher />
        <SoundToggle />
      </nav>
    </header>
  );
}

const dockLinks = [
  ...socialLinks.map((item) => ({
    ...item,
    analytics: {
      "data-analytics-event": "Social Link Clicked",
      "data-analytics-network": item.label,
    },
    download: false,
    sound: "tap",
  })),
  {
    label: "Download CV",
    href: "/cv.pdf",
    icon: RiDownloadLine,
    analytics: {
      "data-analytics-event": "CV Download Clicked",
    },
    download: true,
    sound: "download",
  },
];

function DockLink({
  className,
  item,
}: {
  className?: string;
  item: (typeof dockLinks)[number];
}) {
  const Icon = item.icon;
  const external = item.href.startsWith("http");
  return (
    <Button asChild variant="tertiary" size="icon" className={className}>
      <a
        href={item.href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        download={item.download || undefined}
        aria-label={item.label}
        title={item.label}
        {...item.analytics}
        data-analytics-location="Layout Bottom"
        data-sound={item.sound}
        data-sound-hover="hover"
      >
        <Icon data-icon="inline-start" aria-hidden="true" />
      </a>
    </Button>
  );
}

const ICON_SHOWN = {
  opacity: 1,
  scale: 1,
  filter: "blur(0px)",
};
const ICON_HIDDEN = {
  opacity: 0,
  scale: 0.6,
  filter: "blur(4px)",
};
const iconEnter = {
  type: "tween" as const,
  duration: spring.fast.duration,
  ease: "easeOut" as const,
};
const iconLeave = {
  type: "tween" as const,
  ...spring.fast.exit,
  ease: "easeIn" as const,
};
// Each link starts tucked toward the trigger, the farthest ones farthest in,
// so the row reads as unfolding out of the button.
const TUCK_STEP = 10;
const STAGGER = 0.025;

export function SiteSocialLinks() {
  const reduceMotion = useReducedMotion();
  const dockRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  // A click that collapses the dock wins over the pointer still resting on it.
  const [dismissed, setDismissed] = useState(false);
  const open = !dismissed && (hovered || focused || pinned);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPinned(false);
      setDismissed(true);
    };
    const closeOnOutsidePress = (event: globalThis.PointerEvent) => {
      if (dockRef.current?.contains(event.target as Node)) return;
      setPinned(false);
      setFocused(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePress);
    };
  }, [
    open,
  ]);

  const toggle = useCallback(() => {
    if (open) {
      setPinned(false);
      setDismissed(true);
    } else {
      setDismissed(false);
      setPinned(true);
    }
  }, [
    open,
  ]);

  const handlePointerEnter = useCallback((event: PointerEvent) => {
    if (event.pointerType === "mouse") setHovered(true);
  }, []);

  const handlePointerLeave = useCallback((event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    setHovered(false);
    setDismissed(false);
  }, []);

  const handleFocus = useCallback((event: FocusEvent) => {
    if (event.target.matches(":focus-visible")) setFocused(true);
  }, []);

  const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setFocused(false);
    setDismissed(false);
  }, []);

  // Below 960px the fixed sticker pile sits in this corner; keep the links above it.
  return (
    <footer className="mt-auto flex justify-end pb-28 min-[960px]:pb-6">
      {/* Touch screens have no hover to unfold the dock, so they get every
          link up front at a 44px tap size. CSS picks the layout, so there is
          no collapsed flash before hydration. */}
      <ul
        aria-label="Contact links"
        className="hidden flex-wrap justify-end gap-1 pointer-coarse:flex"
      >
        {dockLinks.map((item) => (
          <li key={item.label}>
            <DockLink item={item} className="size-11" />
          </li>
        ))}
      </ul>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: hover and focus-within open the dock; the trigger button is the interactive control. */}
      <div
        ref={dockRef}
        className="relative flex items-center pointer-coarse:hidden"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <Button
          type="button"
          variant="tertiary"
          size="icon"
          aria-label={open ? "Hide contact links" : "Show contact links"}
          aria-expanded={open}
          aria-controls={listId}
          title="Contact"
          onClick={toggle}
          data-sound="tap"
          data-sound-hover="hover"
        >
          <span className="grid size-4" aria-hidden="true">
            <motion.span
              className="col-start-1 row-start-1 flex"
              initial={false}
              animate={open ? ICON_HIDDEN : ICON_SHOWN}
              transition={open ? iconLeave : iconEnter}
            >
              <RiAtLine className="size-4" />
            </motion.span>
            <motion.span
              className="col-start-1 row-start-1 flex"
              initial={false}
              animate={open ? ICON_SHOWN : ICON_HIDDEN}
              transition={open ? iconEnter : iconLeave}
            >
              <RiCloseLine className="size-4" />
            </motion.span>
          </span>
        </Button>
        {/* Overlays the empty space left of the trigger, so opening never
            shifts the footer; the hover zone covers the row and its gaps. */}
        <ul
          id={listId}
          aria-label="Contact links"
          inert={!open}
          className={cn(
            "absolute top-0 right-full flex items-center gap-1 pr-1",
            !open && "pointer-events-none",
          )}
        >
          {dockLinks.map((item, index) => {
            const fromTrigger = dockLinks.length - index;
            return (
              <motion.li
                key={item.label}
                initial={false}
                animate={
                  open
                    ? {
                        opacity: 1,
                        x: 0,
                        scale: 1,
                      }
                    : {
                        opacity: 0,
                        x: reduceMotion ? 0 : fromTrigger * TUCK_STEP,
                        scale: reduceMotion ? 1 : 0.6,
                      }
                }
                transition={
                  open
                    ? {
                        ...spring.moderate,
                        delay: (fromTrigger - 1) * STAGGER,
                      }
                    : {
                        type: "tween",
                        ...spring.moderate.exit,
                        ease: "easeIn",
                        delay: (index * STAGGER) / 2,
                      }
                }
              >
                <DockLink item={item} />
              </motion.li>
            );
          })}
        </ul>
      </div>
    </footer>
  );
}
