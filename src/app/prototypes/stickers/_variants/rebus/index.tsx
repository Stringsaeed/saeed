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
import { SENTENCE, TITLE } from "./copy";
import styles from "./rebus.module.css";

// biome-ignore lint/style/useComponentExportOnlyModules: read by the prototype registry.
export const kind = "inline";
// biome-ignore lint/style/useComponentExportOnlyModules: read by the prototype registry.
export const pickerPosition: "top" | "bottom" = "bottom";

// Each sticker is fitted into a square exactly one text line tall, so it
// sits in the sentence like an icon or an emoji, never taller than the type.
const BOX_REM = 1.75;
const ART_SIZES = "64px";

const BY_ID = new Map(
  STICKERS.map((sticker) => [
    sticker.id,
    sticker,
  ]),
);

function slotStyle(sticker: StickerDefinition) {
  const fit = Math.min(BOX_REM / sticker.width, BOX_REM / sticker.height);
  return {
    "--art-w": `${(sticker.width * fit).toFixed(3)}rem`,
    "--art-h": `${(sticker.height * fit).toFixed(3)}rem`,
  } as CSSProperties;
}

export default function Variant() {
  const onSlotPointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      if (event.pointerType === "mouse") playHoverSound("hover");
    },
    [],
  );

  return (
    <div className={cn(styles.root, "max-w-152")}>
      <h2 className="list-heading backdrop-plate">{TITLE}</h2>

      <p
        className={cn(
          styles.sentence,
          "backdrop-plate mt-4 text-base leading-7 text-muted-foreground",
        )}
      >
        {SENTENCE.map((token, index) => {
          if (typeof token === "string") {
            // biome-ignore lint/suspicious/noArrayIndexKey: the sentence is static.
            return <span key={index}>{token}</span>;
          }
          const sticker = BY_ID.get(token.id);
          if (!sticker) return null;
          return (
            <span
              key={token.id}
              className={styles.slot}
              style={slotStyle(sticker)}
              onPointerEnter={onSlotPointerEnter}
            >
              <span data-sticker-art={sticker.id} className={styles.art}>
                <Image
                  src={sticker.src}
                  alt={token.word}
                  width={sticker.width}
                  height={sticker.height}
                  sizes={ART_SIZES}
                  loading="eager"
                  draggable={false}
                />
              </span>
            </span>
          );
        })}
      </p>
    </div>
  );
}
