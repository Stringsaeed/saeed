"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { STICKERS, type StickerDefinition } from "@/components/sticker-data";
import { playHoverSound, playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import styles from "./things.module.css";
import { CLAUSES, type ThingSlot, TITLE } from "./things-copy";

// Things: one sentence about me with the eight stickers standing in for
// its nouns, sized like inline icons. Each clause shows only its subject
// and verb; press them and the rest of the clause, sticker included, comes
// into focus. The stories behind them belong in a blog post
// (docs/things-stories.md), not on the home page.

type StickerId = StickerDefinition["id"];

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

// Pressing the heading three times in a row shows everything, so nobody has
// to work through all eight pills; three more hide it again. The presses
// have to come quickly, like a triple-click, or an old stray press would
// count towards a later one.
const TITLE_PRESSES = 3;
const TITLE_PRESS_WINDOW_MS = 1500;
const ALL_IDS: ReadonlySet<StickerId> = new Set(CLAUSES.map((c) => c.id));

export function Things() {
  const [open, setOpen] = useState<ReadonlySet<StickerId>>(() => new Set());
  const titlePresses = useRef(0);
  const titleTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(titleTimer.current), []);

  const toggle = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const id = event.currentTarget.dataset.clause as StickerId;
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
        playSound("tap");
      } else {
        next.add(id);
        playSound("select");
      }
      return next;
    });
  }, []);

  const onTitlePress = useCallback(() => {
    window.clearTimeout(titleTimer.current);
    titlePresses.current += 1;
    if (titlePresses.current < TITLE_PRESSES) {
      playSound("tap");
      titleTimer.current = window.setTimeout(() => {
        titlePresses.current = 0;
      }, TITLE_PRESS_WINDOW_MS);
      return;
    }
    titlePresses.current = 0;
    setOpen((current) => {
      const everything = current.size === ALL_IDS.size;
      playSound(everything ? "tap" : "select");
      return everything ? new Set() : ALL_IDS;
    });
  }, []);

  return (
    <div
      className={cn(styles.root, "max-w-152")}
      data-analytics-view="Content Viewed"
      data-analytics-label="Things"
    >
      <h2 className="list-heading backdrop-plate">
        <button
          type="button"
          className={styles.title}
          aria-expanded={open.size === ALL_IDS.size}
          aria-description="Press three times to show or hide everything"
          data-sound-hover="hover"
          onClick={onTitlePress}
        >
          {TITLE}
        </button>
      </h2>

      <p
        className={cn(
          styles.sentence,
          "backdrop-plate mt-4 text-base leading-7 text-muted-foreground",
        )}
      >
        {CLAUSES.map((clause, index) => {
          const isOpen = open.has(clause.id);
          const restId = `thing-${clause.id}`;
          return (
            <span key={clause.id} className={styles.clause}>
              {index > 0 ? " " : null}
              <button
                type="button"
                data-clause={clause.id}
                aria-expanded={isOpen}
                aria-controls={restId}
                className={styles.lead}
                data-sound-hover="hover"
                onClick={toggle}
              >
                {clause.lead}
              </button>
              <span
                id={restId}
                className={styles.rest}
                data-open={isOpen ? "" : undefined}
              >
                {clause.rest.map((token, tokenIndex) => {
                  if (typeof token === "string") {
                    // biome-ignore lint/suspicious/noArrayIndexKey: the sentence is static.
                    return <span key={tokenIndex}>{token}</span>;
                  }
                  const sticker = BY_ID.get(token.id);
                  if (!sticker) return <span key={token.id}>{token.word}</span>;
                  return <Slot key={token.id} slot={token} sticker={sticker} />;
                })}
              </span>
            </span>
          );
        })}
      </p>
    </div>
  );
}
