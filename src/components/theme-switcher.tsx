"use client";

import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";

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

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const selectedTheme = mounted ? (theme ?? "system") : "system";
  const options = useMemo(
    () =>
      themeOptions.map((option) => ({
        ...option,
        onSelect: () => setTheme(option.value),
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} size="compact">
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
            <span
              className="relative flex size-4 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <RiSunLine className="absolute inset-0 size-4 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
              <RiMoonLine className="absolute inset-0 size-4 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
            </span>
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
