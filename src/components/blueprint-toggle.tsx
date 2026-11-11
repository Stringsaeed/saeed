"use client";

import { RiCompass3Line, RiPencilRuler2Line } from "@remixicon/react";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  shouldHandleBlueprintShortcut,
  toggleBlueprint,
  useBlueprint,
} from "@/lib/blueprint";
import { cn } from "@/lib/utils";

function originFromElement(element: HTMLElement | null) {
  if (!element) return undefined;
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function BlueprintToggle({ className }: { className?: string }) {
  const enabled = useBlueprint();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    toggleBlueprint(originFromElement(buttonRef.current));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldHandleBlueprintShortcut(event)) return;
      event.preventDefault();
      toggleBlueprint(originFromElement(buttonRef.current));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="surface"
      size="icon"
      active={enabled}
      aria-label="Blueprint mode"
      aria-pressed={enabled}
      aria-keyshortcuts="b"
      title={enabled ? "Exit blueprint mode (B)" : "Blueprint mode (B)"}
      data-analytics-event="Blueprint Toggled"
      data-analytics-label={enabled ? "Off" : "On"}
      data-analytics-location="Header"
      data-sound-hover="hover"
      className={cn(className)}
      onClick={handleToggle}
    >
      <span
        className="relative flex size-4 shrink-0 items-center justify-center"
        aria-hidden="true"
      >
        <RiPencilRuler2Line
          className={cn(
            "absolute inset-0 size-4 transition-transform duration-200",
            enabled ? "-rotate-90 scale-0" : "rotate-0 scale-100",
          )}
        />
        <RiCompass3Line
          className={cn(
            "absolute inset-0 size-4 transition-transform duration-200",
            enabled ? "rotate-0 scale-100" : "rotate-90 scale-0",
          )}
        />
      </span>
    </Button>
  );
}
