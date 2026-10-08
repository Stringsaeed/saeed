"use client";

import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";
import { playSound } from "@/lib/sound";
import { ThemeIcon } from "./theme-switcher-trigger";

const themeOptions = [
  {
    label: "System",
    value: "system",
    icon: RiComputerLine,
  },
  {
    label: "Light",
    value: "light",
    icon: RiSunLine,
  },
  {
    label: "Dark",
    value: "dark",
    icon: RiMoonLine,
  },
] as const;

export function ThemeSwitcher({
  defaultOpen = false,
}: {
  /** Opens on mount, for a press that landed before this module loaded. */
  defaultOpen?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const { setTheme, theme } = useTheme();
  const selectedTheme = mounted ? (theme ?? "system") : "system";
  const options = useMemo(
    () =>
      themeOptions.map((option) => ({
        ...option,
        onSelect: () => {
          playSound("select");
          setTheme(option.value);
        },
      })),
    [
      setTheme,
    ],
  );
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedTheme),
  );
  const selectedLabel = options[selectedIndex].label;

  useEffect(() => setMounted(true), []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) playSound("menuOpen");
    setOpen(nextOpen);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} size="compact">
      <DropdownTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            active={open}
            aria-label={`Choose theme, current: ${selectedLabel}`}
            title={`Theme: ${selectedLabel}`}
          >
            <ThemeIcon />
          </Button>
        }
      />
      <DropdownContent
        align="end"
        checkedIndex={selectedIndex}
        className="w-36"
      >
        {options.map((option, index) => (
          <MenuItem
            key={option.value}
            index={index}
            icon={option.icon}
            label={option.label}
            checked={selectedTheme === option.value}
            onSelect={option.onSelect}
          />
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}
