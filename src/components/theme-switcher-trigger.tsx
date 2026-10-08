"use client";

import { RiMoonLine, RiSunLine } from "@remixicon/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { onIdle } from "@/lib/idle";

export function ThemeIcon() {
  return (
    <span
      className="relative flex size-4 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      <RiSunLine className="absolute inset-0 size-4 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
      <RiMoonLine className="absolute inset-0 size-4 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
    </span>
  );
}

type PlaceholderProps = {
  onActivate?: () => void;
  onIntent?: () => void;
};

// Same markup the menu's trigger renders while it is closed, so the swap is
// invisible.
function ThemeTriggerPlaceholder({ onActivate, onIntent }: PlaceholderProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Choose theme, current: System"
      title="Theme: System"
      onClick={onActivate}
      onFocus={onIntent}
      onPointerEnter={onIntent}
    >
      <ThemeIcon />
    </Button>
  );
}

const loadThemeSwitcher = () => import("./theme-switcher");

const ThemeSwitcherMenu = dynamic(
  () => loadThemeSwitcher().then((module) => module.ThemeSwitcher),
  {
    ssr: false,
    loading: () => <ThemeTriggerPlaceholder />,
  },
);

/**
 * The theme menu pulls in Base UI's Menu, Floating UI, and Motion. None of it
 * is needed to paint the header, so it loads once the page settles, or as
 * soon as someone reaches for the button.
 */
export function ThemeSwitcher() {
  const [ready, setReady] = useState(false);
  const [openOnMount, setOpenOnMount] = useState(false);

  useEffect(() => onIdle(() => setReady(true)), []);

  if (ready) return <ThemeSwitcherMenu defaultOpen={openOnMount} />;

  return (
    <ThemeTriggerPlaceholder
      onActivate={() => {
        setOpenOnMount(true);
        setReady(true);
      }}
      onIntent={() => void loadThemeSwitcher()}
    />
  );
}
