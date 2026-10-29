"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
} from "react";
import { STICKERS, type StickerDefinition } from "@/components/sticker-data";
import { playHoverSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import styles from "./shelf.module.css";

// biome-ignore lint/style/useComponentExportOnlyModules: read by the prototype registry.
export const kind = "inline";
// biome-ignore lint/style/useComponentExportOnlyModules: read by the prototype registry.
export const pickerPosition: "top" | "bottom" = "bottom";

const TITLE = "Things";

// Every sticker is fitted into the same square so no object outweighs the
// others; the box is the only size the row needs to know.
const BOX = 56;
const ART_SIZES = "120px";

function artStyle(sticker: StickerDefinition) {
  const fit = Math.min(BOX / sticker.width, BOX / sticker.height);
  return {
    "--art-w": `${Math.round(sticker.width * fit)}px`,
    "--art-h": `${Math.round(sticker.height * fit)}px`,
  } as CSSProperties;
}

export default function Variant() {
  const onPointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>) => {
      if (event.pointerType === "mouse") playHoverSound("hover");
    },
    [],
  );

  return (
    <div className="max-w-152">
      <h2 className="list-heading backdrop-plate">{TITLE}</h2>
      <ul
        className={cn(styles.shelf, "mt-4")}
        aria-label="Eight things I keep close"
      >
        {STICKERS.map((sticker) => (
          <li
            key={sticker.id}
            className={styles.cell}
            onPointerEnter={onPointerEnter}
          >
            <span
              data-sticker-art={sticker.id}
              className={styles.art}
              style={artStyle(sticker)}
            >
              <Image
                src={sticker.src}
                alt={sticker.label}
                width={sticker.width}
                height={sticker.height}
                sizes={ART_SIZES}
                loading="eager"
                draggable={false}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
