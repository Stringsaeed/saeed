"use client";

import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { flushSync } from "react-dom";
import { useStoryReadTracking } from "@/lib/desk-experiment";
import { playSound } from "@/lib/sound";
import {
  STICKERS,
  type StickerDefinition,
  stickerTransitionName,
} from "./sticker-data";
import styles from "./sticker-paperweights.module.css";
import { STICKER_ART_SIZES } from "./sticker-transition";

type StickerId = StickerDefinition["id"];

type StickerPaperweightsProps = {
  onClose: () => void;
};

// Pitch order: pyramids, tower, bass, keyboard, controller, monstera, pencil, bottle.
const READING_ORDER = [
  "pyramids",
  "burj",
  "bass",
  "keyboard",
  "controller",
  "monstera",
  "pencil",
  "babylon",
] as const satisfies readonly StickerId[];

type Placement = {
  w: number;
  pullX: number;
  pullY: number;
  restRot: number;
  parkRot: number;
  narrowW: number;
  narrowLeft: string;
  narrowTop: string;
  narrowRot: number;
};

// Two hand-placed arrangements. Desktop pulls each weight left out of the
// margin lane onto the opening lines. Narrow drops it straight on the page.
const PLACEMENT: Record<StickerId, Placement> = {
  pyramids: {
    w: 188,
    pullX: -420,
    pullY: 46,
    restRot: -7.5,
    parkRot: -2.5,
    narrowW: 142,
    narrowLeft: "12%",
    narrowTop: "3.1rem",
    narrowRot: -8,
  },
  burj: {
    w: 64,
    pullX: -300,
    pullY: 42,
    restRot: 6,
    parkRot: 2,
    narrowW: 50,
    narrowLeft: "62%",
    narrowTop: "3rem",
    narrowRot: 6.5,
  },
  bass: {
    w: 124,
    pullX: -430,
    pullY: 40,
    restRot: -13,
    parkRot: -4,
    narrowW: 100,
    narrowLeft: "22%",
    narrowTop: "3.15rem",
    narrowRot: -12,
  },
  keyboard: {
    w: 188,
    pullX: -470,
    pullY: 52,
    restRot: 3.5,
    parkRot: 1,
    narrowW: 148,
    narrowLeft: "4%",
    narrowTop: "3.25rem",
    narrowRot: 4,
  },
  controller: {
    w: 158,
    pullX: -372,
    pullY: 44,
    restRot: -4.5,
    parkRot: -1.5,
    narrowW: 124,
    narrowLeft: "18%",
    narrowTop: "3.1rem",
    narrowRot: -5,
  },
  monstera: {
    w: 132,
    pullX: -318,
    pullY: 38,
    restRot: 10,
    parkRot: 3.5,
    narrowW: 104,
    narrowLeft: "32%",
    narrowTop: "3rem",
    narrowRot: 9,
  },
  pencil: {
    w: 126,
    pullX: -492,
    pullY: 48,
    restRot: -16,
    parkRot: -6,
    narrowW: 104,
    narrowLeft: "14%",
    narrowTop: "3.2rem",
    narrowRot: -15,
  },
  babylon: {
    w: 86,
    pullX: -250,
    pullY: 40,
    restRot: 8,
    parkRot: 3,
    narrowW: 68,
    narrowLeft: "56%",
    narrowTop: "2.95rem",
    narrowRot: 7,
  },
};

function stickerById(id: StickerId) {
  const sticker = STICKERS.find((item) => item.id === id);
  if (!sticker) throw new Error(`Missing sticker: ${id}`);
  return sticker;
}

const CHAPTERS = READING_ORDER.map((id) => stickerById(id));

type WeightStyle = CSSProperties & {
  "--w": string;
  "--pull-x": string;
  "--pull-y": string;
  "--rest-rot": string;
  "--park-rot": string;
  "--narrow-w": string;
  "--narrow-left": string;
  "--narrow-top": string;
  "--narrow-rot": string;
  "--ar": string;
};

function weightStyle(sticker: StickerDefinition): WeightStyle {
  const place = PLACEMENT[sticker.id];
  return {
    "--w": `${place.w}px`,
    "--pull-x": `${place.pullX}px`,
    "--pull-y": `${place.pullY}px`,
    "--rest-rot": `${place.restRot}deg`,
    "--park-rot": `${place.parkRot}deg`,
    "--narrow-w": `${place.narrowW}px`,
    "--narrow-left": place.narrowLeft,
    "--narrow-top": place.narrowTop,
    "--narrow-rot": `${place.narrowRot}deg`,
    "--ar": `${sticker.width} / ${sticker.height}`,
  };
}

function paragraphs(story: string) {
  return story.split(/\n\n+/);
}

// Eight stickers hold down eight chapters; lifting one clears the grain from
// its story. Opened from the corner pile (see StickerPile).
export function StickerPaperweights({ onClose }: StickerPaperweightsProps) {
  const reduced = useReducedMotion() === true;
  const [lifted, setLifted] = useState<StickerId | null>(null);
  const [cursor, setCursor] = useState(0);
  useStoryReadTracking(lifted);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const liftedRef = useRef(lifted);
  const cursorRef = useRef(cursor);
  const onCloseRef = useRef(onClose);
  const reducedRef = useRef(reduced);
  liftedRef.current = lifted;
  cursorRef.current = cursor;
  onCloseRef.current = onClose;
  reducedRef.current = reduced;

  useEffect(() => {
    rootRef.current?.focus({
      preventScroll: true,
    });
  }, []);

  // Putting a weight back presses it onto the paper.
  const settle = useCallback(() => {
    if (liftedRef.current) playSound("stickerPlace");
    setLifted(null);
  }, []);

  const closeAll = useCallback(() => {
    if (liftedRef.current) {
      flushSync(() => setLifted(null));
      rootRef.current?.getBoundingClientRect();
    }
    onCloseRef.current();
  }, []);

  const stepBack = useCallback(() => {
    if (liftedRef.current) settle();
    else closeAll();
  }, [
    settle,
    closeAll,
  ]);

  // Lifting peels a weight off the paper; lifting the open one again puts it
  // back. Swapping only peels: the old weight settling stays quiet under it.
  const lift = useCallback((id: StickerId, index: number) => {
    setCursor(index);
    playSound(liftedRef.current === id ? "stickerPlace" : "stickerLift");
    setLifted((current) => (current === id ? null : id));
  }, []);

  const registerButton = useCallback((node: HTMLButtonElement | null) => {
    if (!node) return;
    const index = Number(node.dataset.index);
    buttonRefs.current[index] = node;
    return () => {
      buttonRefs.current[index] = null;
    };
  }, []);

  const onWeightClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      const id = event.currentTarget.dataset.weight as StickerId | undefined;
      const index = Number(event.currentTarget.dataset.index);
      if (!id || Number.isNaN(index)) return;
      lift(id, index);
    },
    [
      lift,
    ],
  );

  const moveCursor = useCallback((index: number) => {
    const next = Math.max(0, Math.min(CHAPTERS.length - 1, index));
    setCursor(next);
    buttonRefs.current[next]?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Escape") {
        event.preventDefault();
        if (liftedRef.current) settle();
        else closeAll();
        return;
      }

      // Tab stays inside the modal desk, wrapping between its first and last
      // stops instead of walking into the page behind.
      if (event.key === "Tab") {
        const root = rootRef.current;
        if (!root) return;
        const stops = Array.from(
          root.querySelectorAll<HTMLElement>(
            "a[href], button:not(:disabled), [tabindex]",
          ),
        ).filter((element) => element.tabIndex >= 0);
        const first = stops[0];
        const last = stops.at(-1);
        if (!first || !last) return;
        const active = document.activeElement;
        const outside = active === root || !root.contains(active);
        if (event.shiftKey && (active === first || outside)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (active === last || outside)) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      const arrows = [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ];
      if (!arrows.includes(event.key)) return;

      const selection = window.getSelection();
      const root = rootRef.current;
      if (
        event.shiftKey &&
        selection &&
        !selection.isCollapsed &&
        root?.contains(selection.anchorNode)
      ) {
        return;
      }

      event.preventDefault();
      const current = cursorRef.current;
      if (event.key === "Home") moveCursor(0);
      else if (event.key === "End") moveCursor(CHAPTERS.length - 1);
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
        moveCursor(current - 1);
      else moveCursor(current + 1);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    settle,
    closeAll,
    moveCursor,
  ]);

  const onWeightPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse" || reducedRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    event.currentTarget.style.setProperty("--tip", `${(-x * 9).toFixed(2)}deg`);
  };

  const onWeightPointerLeave = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.currentTarget.style.removeProperty("--tip");
  };

  const onDeskKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" || event.target !== rootRef.current) return;
    event.preventDefault();
    const index = cursorRef.current;
    const sticker = CHAPTERS[index];
    if (!sticker) return;
    lift(sticker.id, index);
    buttonRefs.current[index]?.focus();
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Sticker desk"
      tabIndex={-1}
      className={styles.desk}
      data-open={lifted ? "" : undefined}
      onKeyDown={onDeskKeyDown}
    >
      {/* Pointer-only dismissal: keyboard and screen reader users have Escape
          and the Close button, so the backdrop stays out of the a11y tree. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: pointer-only twin of Escape and Close. */}
      <div role="presentation" className={styles.backdrop} onClick={stepBack} />
      <div className={styles.sheet}>
        <header className={`${styles.mast} ${styles.frame}`}>
          <div>
            <p className={styles.kicker}>Eight pages</p>
            <h1 className={styles.wordmark}>Held down</h1>
          </div>
          <button type="button" className={styles.close} onClick={closeAll}>
            Close
          </button>
        </header>
        <p className={`${styles.lede} ${styles.frame}`}>
          Lift a weight to read. The others stay where they are.
        </p>
        <ol className={styles.list}>
          {CHAPTERS.map((sticker, index) => {
            const headingId = `paperweight-${sticker.id}`;
            const open = lifted === sticker.id;
            return (
              <li
                key={sticker.id}
                className={`${styles.chapter} ${styles.frame}`}
                data-lifted={open ? "" : undefined}
              >
                <div>
                  <div className={styles.headingRow}>
                    <h2 id={headingId} className={styles.heading}>
                      {sticker.label}
                    </h2>
                    <span className={styles.index}>
                      {String(index + 1).padStart(2, "0")} / 08
                    </span>
                  </div>
                  <div className={styles.passage}>
                    <div className={styles.copy}>
                      {paragraphs(sticker.story).map((paragraph) => (
                        <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                      ))}
                    </div>
                    <div className={styles.scrim} aria-hidden="true">
                      <div className={styles.wash} />
                      <div className={styles.grain} />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  ref={registerButton}
                  className={styles.hit}
                  style={weightStyle(sticker)}
                  data-weight={sticker.id}
                  data-index={index}
                  aria-controls={headingId}
                  aria-expanded={open}
                  aria-label={
                    open ? `Put ${sticker.label} back` : `Lift ${sticker.label}`
                  }
                  tabIndex={cursor === index ? 0 : -1}
                  onClick={onWeightClick}
                  onPointerMove={onWeightPointerMove}
                  onPointerLeave={onWeightPointerLeave}
                >
                  <ViewTransition
                    name={stickerTransitionName(sticker.id)}
                    share="sticker-morph"
                    default="none"
                  >
                    <span data-sticker-art={sticker.id} className={styles.art}>
                      <Image
                        src={sticker.src}
                        alt=""
                        width={sticker.width}
                        height={sticker.height}
                        sizes={STICKER_ART_SIZES}
                        loading="eager"
                        draggable={false}
                        className="size-full object-contain"
                      />
                    </span>
                  </ViewTransition>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
