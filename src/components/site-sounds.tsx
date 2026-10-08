"use client";

import { useEffect } from "react";
import { onIdle } from "@/lib/idle";
import {
  isSoundName,
  loadSoundEngine,
  playHoverSound,
  playSound,
} from "@/lib/sound";

/**
 * Plays the cue named by `data-sound` when an element is pressed, and
 * `data-sound-hover` when a mouse first moves onto it. Press sounds fire on
 * pointer down so they land with the finger; keyboard activation arrives as a
 * click with no pointer behind it.
 */
export function SiteSounds() {
  useEffect(() => onIdle(loadSoundEngine), []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !(event.target instanceof Element)) return;
      const name =
        event.target.closest<HTMLElement>("[data-sound]")?.dataset.sound;
      if (isSoundName(name)) playSound(name);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.detail !== 0 || !(event.target instanceof Element)) return;
      const name =
        event.target.closest<HTMLElement>("[data-sound]")?.dataset.sound;
      if (isSoundName(name)) playSound(name);
    };

    const handlePointerOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !(event.target instanceof Element))
        return;
      const element = event.target.closest<HTMLElement>("[data-sound-hover]");
      // Moving between children of the same element is not a new arrival.
      if (
        !element ||
        (event.relatedTarget instanceof Node &&
          element.contains(event.relatedTarget))
      )
        return;
      const name = element.dataset.soundHover;
      if (isSoundName(name)) playHoverSound(name);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("pointerover", handlePointerOver, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("pointerover", handlePointerOver, true);
    };
  }, []);

  return null;
}
