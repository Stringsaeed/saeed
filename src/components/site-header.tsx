"use client";

import {
  type RemixiconComponentType,
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
import { BlueprintToggle } from "./blueprint-toggle";
import { SaeedName } from "./saeed-name";
import { SoundToggle } from "./sound-toggle";
import { ThemeSwitcher } from "./theme-switcher-trigger";
import { Button } from "./ui/button";

// Simple Icons Letterboxd mark (CC0). The package ships the whole set, so
// the three brand dots are copied here: orange, green, blue.
const LetterboxdIcon: RemixiconComponentType = ({
  color: _color,
  size = 24,
  className,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    width={size}
    height={size}
    fill="none"
    stroke="none"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="#FF8000"
      d="M8.224 14.352a4.447 4.447 0 0 1-3.775 2.092C1.992 16.444 0 14.454 0 12s1.992-4.444 4.45-4.444c1.592 0 2.988.836 3.774 2.092-.427.682-.673 1.488-.673 2.352s.246 1.67.673 2.352z"
    />
    <path
      fill="#00E054"
      d="M15.101 12c0-.864.247-1.67.674-2.352-.786-1.256-2.183-2.092-3.775-2.092s-2.989.836-3.775 2.092c.427.682.674 1.488.674 2.352s-.247 1.67-.674 2.352c.786 1.256 2.183 2.092 3.775 2.092s2.989-.836 3.775-2.092A4.42 4.42 0 0 1 15.1 12z"
    />
    <path
      fill="#40BCF4"
      d="M19.551 7.556a4.447 4.447 0 0 0-3.775 2.092c.427.682.673 1.488.673 2.352s-.246 1.67-.673 2.352a4.447 4.447 0 0 0 3.775 2.092C22.008 16.444 24 14.454 24 12s-1.992-4.444-4.45-4.444z"
    />
  </svg>
);

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
  {
    label: "Letterboxd",
    href: "https://letterboxd.com/stringsaeed/",
    icon: LetterboxdIcon,
  },
];

// The header needs about 454px for the labelled Blog and Links buttons plus
// the three mode toggles, so below 464px they collapse to icon-only squares
// (the label stays in the DOM for screen readers), and below 370px the icon
// squares tighten from 36px to 32px so 320px phones keep breathing room.
const NAV_LINK_CLASS =
  "max-[463px]:w-9 max-[463px]:gap-0 max-[463px]:px-0 max-[369px]:size-8";
const NAV_ICON_CLASS = "max-[369px]:size-8";
const NAV_LABEL_CLASS = "max-[463px]:sr-only";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-2 py-6 sm:gap-3">
      <Link
        className="backdrop-plate flex shrink-0 items-center gap-2 sm:gap-3"
        href="/"
        data-analytics-event="Navigation Clicked"
        data-analytics-destination="Home"
        data-analytics-location="Header"
        data-sound="tap"
      >
        <AnimatedAvatar />
        <SaeedName className="signature-name" />
      </Link>

      <nav
        className="ml-auto flex items-center gap-1.5 max-[369px]:gap-1 sm:gap-2"
        aria-label="Site links"
      >
        <Button
          asChild
          variant="surface"
          leadingIcon={RiArticleLine}
          className={NAV_LINK_CLASS}
        >
          <Link
            href="/blog"
            data-analytics-event="Navigation Clicked"
            data-analytics-destination="Blog"
            data-analytics-location="Header"
            data-sound="tap"
            title="Blog"
          >
            <span className={NAV_LABEL_CLASS}>Blog</span>
          </Link>
        </Button>
        <Button
          asChild
          variant="surface"
          leadingIcon={RiLinksLine}
          className={NAV_LINK_CLASS}
        >
          <Link
            href="/links"
            data-analytics-event="Navigation Clicked"
            data-analytics-destination="Links"
            data-analytics-location="Header"
            data-sound="tap"
            title="Links"
          >
            <span className={NAV_LABEL_CLASS}>Links</span>
          </Link>
        </Button>
        <BlueprintToggle className={NAV_ICON_CLASS} />
        <ThemeSwitcher className={NAV_ICON_CLASS} />
        <SoundToggle className={NAV_ICON_CLASS} />
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

  return (
    <footer className="mt-auto flex justify-end pb-6">
      {/* Touch screens have no hover to unfold the dock, so they get every
          link up front at a 44px tap size. CSS picks the layout, so there is
          no collapsed flash before hydration. Eight of them need 380px; on
          narrower phones the row is capped at four, so it breaks four over
          four instead of leaving the CV link alone on a second line. */}
      <ul
        aria-label="Contact links"
        className="hidden flex-wrap justify-end gap-1 pointer-coarse:flex max-[427px]:max-w-[11.75rem]"
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
