"use client";

import { useCallback } from "react";
import type { ProjectLinkType } from "@/data/projects";
import {
  CARTRIDGE_BY_ID,
  CARTRIDGE_THINGS,
  type Cartridge,
} from "./cartridge-models";
import styles from "./desk.module.css";
import { RetroView } from "./retro-view";

// The apps as cartridges on a shelf: shipped ones in the front row, side
// projects behind. Touch one and its stores and sources appear below.

const ROWS = {
  wide: 2,
  narrow: 4,
};

const LINK_LABELS: Record<ProjectLinkType, string> = {
  "app-store": "App Store",
  "play-store": "Google Play",
  github: "GitHub",
  web: "Web",
  press: "Press",
  linkedin: "LinkedIn",
  testflight: "TestFlight",
};

function describe(id: string) {
  const cartridge = CARTRIDGE_BY_ID.get(id);
  return cartridge ? `${cartridge.name}. ${cartridge.description}` : id;
}

function Links({ cartridge }: { cartridge: Cartridge }) {
  return (
    <span className={styles.links}>
      {cartridge.links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={link.ariaLabel}
          data-sound="tap"
          data-analytics-event="Project Link Clicked"
          data-analytics-project={cartridge.name}
          data-analytics-location="Home"
        >
          {LINK_LABELS[link.type]}
          {link.platform ? ` ${link.platform}` : ""}
        </a>
      ))}
    </span>
  );
}

export function ProjectsShelf() {
  const caption = useCallback((id: string | null) => {
    const cartridge = id ? CARTRIDGE_BY_ID.get(id) : undefined;
    if (!cartridge) {
      return (
        <span>Apps I shipped in front, side projects behind. Pick one up.</span>
      );
    }
    return (
      <>
        <strong>{cartridge.name}</strong>
        <span>{cartridge.description}</span>
        <Links cartridge={cartridge} />
      </>
    );
  }, []);
  return (
    <RetroView
      things={CARTRIDGE_THINGS}
      label="Apps and side projects"
      rows={ROWS}
      spacing={0.35}
      describe={describe}
      caption={caption}
      stageClassName={styles.shelf}
    />
  );
}
