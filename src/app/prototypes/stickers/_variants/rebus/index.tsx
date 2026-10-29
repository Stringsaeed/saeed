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

type StickerId = StickerDefinition["id"];

// Rendered at most ~2x the tallest inline height.
const ART_SIZES = "120px";

// Inline height (px, before the phone scale) and a tilt per sticker, hand set
// so the line reads as stickers pressed on at different moments. Every height
// fits inside the line (see --line in the stylesheet) so nothing overshoots
// into the lines above or below.
const INLINE: Record<
  StickerId,
  {
    height: number;
    tilt: number;
  }
> = {
  pyramids: {
    height: 38,
    tilt: -2,
  },
  burj: {
    height: 46,
    tilt: 2,
  },
  bass: {
    height: 44,
    tilt: -3,
  },
  keyboard: {
    height: 34,
    tilt: 2,
  },
  controller: {
    height: 34,
    tilt: -3,
  },
  monstera: {
    height: 42,
    tilt: 3,
  },
  pencil: {
    height: 40,
    tilt: -4,
  },
  babylon: {
    height: 44,
    tilt: 2,
  },
};

const BY_ID = new Map(
  STICKERS.map((sticker) => [
    sticker.id,
    sticker,
  ]),
);

function slotStyle(sticker: StickerDefinition) {
  const { height, tilt } = INLINE[sticker.id];
  return {
    "--art-w": `${Math.round((sticker.width / sticker.height) * height)}px`,
    "--art-h": `${height}px`,
    "--tilt": `${tilt}deg`,
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
          "backdrop-plate mt-4 text-base text-foreground",
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
