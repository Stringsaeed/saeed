"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useState,
} from "react";
import { STICKERS, type StickerDefinition } from "@/components/sticker-data";
import { playHoverSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import styles from "./things.module.css";
import { SENTENCE, type ThingSlot, TITLE } from "./things-copy";

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

// Things: one sentence about me with the eight stickers standing in for
// its nouns, sized like inline icons. The stories behind them belong in a
// blog post (docs/things-stories.md), not on the home page.

// One sticker in the line. If its image cannot load, the noun it stands for
// is written out instead, so the sentence still reads in full.
function Slot({
  slot,
  sticker,
}: {
  slot: ThingSlot;
  sticker: StickerDefinition;
}) {
  const [failed, setFailed] = useState(false);
  const onPointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      if (event.pointerType === "mouse") playHoverSound("hover");
    },
    [],
  );
  const onError = useCallback(() => setFailed(true), []);

  if (failed) {
    return <span className={styles.word}>{slot.word}</span>;
  }
  return (
    <span
      className={styles.slot}
      style={slotStyle(sticker)}
      onPointerEnter={onPointerEnter}
    >
      <span data-sticker-art={sticker.id} className={styles.art}>
        <Image
          src={sticker.src}
          alt={slot.word}
          width={sticker.width}
          height={sticker.height}
          sizes={ART_SIZES}
          loading="eager"
          draggable={false}
          onError={onError}
        />
      </span>
    </span>
  );
}

export function Things() {
  return (
    <div
      className={cn(styles.root, "max-w-152")}
      data-analytics-view="Content Viewed"
      data-analytics-label="Things"
    >
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
          if (!sticker) return <span key={token.id}>{token.word}</span>;
          return <Slot key={token.id} slot={token} sticker={sticker} />;
        })}
      </p>
    </div>
  );
}
