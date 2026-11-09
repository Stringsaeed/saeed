"use client";

import { RiCheckLine } from "@remixicon/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { ButtonRow, ListGroup, StaticRow } from "@/components/os/os-list";
import {
  PLATFORM_LABELS,
  PLATFORMS,
  usePlatform,
} from "@/components/os/platform";
import {
  isSoundEnabled,
  playSound,
  setSoundEnabled,
  subscribeSound,
} from "@/lib/sound";

// The phone's Settings app sets the site's settings: which platform it
// pretends to be, light or dark, and whether it makes sounds.

const themes = [
  {
    value: "system",
    label: "Automatic",
    detail: "Follows your device",
  },
  {
    value: "light",
    label: "Light",
    detail: "",
  },
  {
    value: "dark",
    label: "Dark",
    detail: "",
  },
] as const;

function Check({ on }: { on: boolean }) {
  return (
    <span
      className="inline-block size-5 text-[color:var(--os-accent)]"
      aria-hidden="true"
    >
      {on ? <RiCheckLine className="size-5" /> : null}
    </span>
  );
}

const serverSound = () => true;

export function SettingsPanel() {
  const { platform, setPlatform } = usePlatform();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const sound = useSyncExternalStore(
    subscribeSound,
    isSoundEnabled,
    serverSound,
  );
  const current = mounted ? (theme ?? "system") : "system";

  return (
    <>
      <ListGroup
        title="Platform"
        footer="Same site, three builds. iOS and Android dress it as a phone; Web lays it out as a page."
      >
        {PLATFORMS.map((value) => (
          <ButtonRow
            key={value}
            title={PLATFORM_LABELS[value]}
            trailing={<Check on={platform === value} />}
            onClick={() => {
              if (platform === value) return;
              playSound("select");
              setPlatform(value);
            }}
            aria-pressed={platform === value}
          />
        ))}
      </ListGroup>

      <ListGroup title="Appearance">
        {themes.map((option) => (
          <ButtonRow
            key={option.value}
            title={option.label}
            subtitle={option.detail || undefined}
            trailing={<Check on={current === option.value} />}
            onClick={() => {
              playSound("select");
              setTheme(option.value);
            }}
          />
        ))}
      </ListGroup>

      <ListGroup
        title="Sounds"
        footer="Small clicks on taps and a paper snap on the books."
      >
        <StaticRow
          title="Interface sounds"
          trailing={
            <button
              type="button"
              role="switch"
              className="os-switch"
              aria-checked={sound}
              aria-label="Interface sounds"
              onClick={() => setSoundEnabled(!sound)}
              data-analytics-event="Sound Toggled"
              data-analytics-label={sound ? "Off" : "On"}
              data-analytics-location="Settings"
            />
          }
        />
      </ListGroup>

      <ListGroup title="About">
        <StaticRow title="Built with" trailing="Next.js, React" />
        <StaticRow title="Fonts" trailing="Atkinson, Inter, Roboto" />
        <StaticRow title="Wallpaper" trailing="Paper Shaders" />
        <StaticRow title="Hosting" trailing="Vercel" />
      </ListGroup>
    </>
  );
}
