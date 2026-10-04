"use client";

import { RiVolumeMuteLine, RiVolumeUpLine } from "@remixicon/react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { isSoundEnabled, setSoundEnabled, subscribeSound } from "@/lib/sound";

const serverSnapshot = () => true;
const toggleSound = () => setSoundEnabled(!isSoundEnabled());

export function SoundToggle() {
  const enabled = useSyncExternalStore(
    subscribeSound,
    isSoundEnabled,
    serverSnapshot,
  );
  const Icon = enabled ? RiVolumeUpLine : RiVolumeMuteLine;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Sound"
      aria-pressed={enabled}
      title={enabled ? "Turn sound off" : "Turn sound on"}
      data-analytics-event="Sound Toggled"
      data-analytics-label={enabled ? "Off" : "On"}
      data-analytics-location="Header"
      onClick={toggleSound}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
