"use client";

import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCloseLine,
} from "@remixicon/react";
import {
  type AnimationPlaybackControls,
  animate,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { flushSync } from "react-dom";
import { STICKERS, stickerTransitionName } from "@/components/sticker-data";
import { STICKER_ART_SIZES } from "@/components/sticker-transition";
import { cn } from "@/lib/utils";
import type { StickerDisplayProps } from "../types";
import styles from "./mobile.module.css";
import { createMobileSim, type MobileSim } from "./physics";
import {
  type ArmNode,
  armTargets,
  LEAF_PARENT,
  LEAVES,
  type LeafNode,
  ROOT,
  type StickerId,
  TREE_DEPTH,
} from "./tree";

// The hand zone and bottom sheet sit at the bottom centre, so the picker
// moves up.
// biome-ignore lint/style/useComponentExportOnlyModules: read by the prototype registry.
export const pickerPosition: "top" | "bottom" = "top";

const ORDER = STICKERS.map((sticker) => sticker.id);
const TOTAL = String(STICKERS.length).padStart(2, "0");
const HAND_SIZES = "400px";
// The morph from the pile runs 520ms; the mobile stays still until it lands.
const SETTLE_MS = 600;
// Idle drift: one slow CSS pendulum per arm and thread, no two alike.
const ARM_DRIFT = [
  [
    11.3,
    0.45,
  ],
  [
    8.9,
    0.6,
  ],
  [
    9.7,
    -0.6,
  ],
  [
    6.1,
    0.9,
  ],
  [
    7.3,
    -0.9,
  ],
  [
    6.7,
    -0.9,
  ],
  [
    7.9,
    0.9,
  ],
];
const LEAF_DRIFT = [
  [
    4.3,
    1.4,
  ],
  [
    5.1,
    -1.6,
  ],
  [
    4.7,
    1.5,
  ],
  [
    5.9,
    -1.3,
  ],
  [
    4.5,
    -1.5,
  ],
  [
    5.5,
    1.4,
  ],
  [
    4.9,
    1.6,
  ],
  [
    5.3,
    -1.4,
  ],
];
const ENTRANCE_STAGGER_MS = 70;
// Wind: pointer speed (px/ms) that counts as a draft, and how hard it blows.
const WIND_MIN_SPEED = 0.45;
const WIND_LEAF_GAIN = 60;
const WIND_ARM_GAIN = 5;
const WIND_CHECK_MS = 30;
const SHEET_DISMISS_PX = 64;

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Flip = {
  id: StickerId;
  from: Rect;
};

const iconButtonClassName =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-30";

function counter(index: number) {
  return `${String(index + 1).padStart(2, "0")} / ${TOTAL}`;
}

function fit(sticker: LeafNode["sticker"]) {
  const ratio = sticker.width / sticker.height;
  return {
    "--fw": Math.min(1, ratio),
    "--fh": Math.min(1, 1 / ratio),
  } as CSSProperties;
}

function centre(rect: Rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

function markLoaded(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.dataset.loaded = "";
}

// Flies an element from where its twin was to where it is now. The sticker
// moves on its own transform, so nothing it hangs from has to change.
function fly(
  element: HTMLElement,
  from: Rect,
  options: {
    stiffness: number;
    damping: number;
  },
) {
  const to = element.getBoundingClientRect();
  const a = centre(from);
  const b = centre(to);
  const scale = to.width ? from.width / to.width : 1;
  return animate(
    element,
    {
      x: [
        a.x - b.x,
        0,
      ],
      y: [
        a.y - b.y,
        0,
      ],
      scale: [
        scale,
        1,
      ],
    },
    {
      type: "spring",
      ...options,
      mass: 1,
    },
  );
}

function StickerArt({
  sticker,
  className,
  register,
  hiRes,
}: {
  sticker: LeafNode["sticker"];
  className: string;
  register: (node: HTMLSpanElement | null) => void;
  hiRes?: boolean;
}) {
  return (
    <ViewTransition
      name={stickerTransitionName(sticker.id)}
      share="sticker-morph"
      default="none"
    >
      <span
        ref={register}
        data-sticker-art={sticker.id}
        className={className}
        style={fit(sticker)}
      >
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
        {hiRes ? (
          <Image
            src={sticker.src}
            alt=""
            width={sticker.width}
            height={sticker.height}
            sizes={HAND_SIZES}
            draggable={false}
            onLoad={markLoaded}
            className={cn(styles.hiRes, "size-full object-contain")}
          />
        ) : null}
      </span>
    </ViewTransition>
  );
}

export default function Variant({ onClose }: StickerDisplayProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [handId, setHandId] = useState<StickerId | null>(null);
  const [live, setLive] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const armEls = useRef<HTMLElement[]>([]);
  const swingEls = useRef<HTMLElement[]>([]);
  const leafButtons = useRef(new Map<StickerId, HTMLButtonElement>());
  const leafArt = useRef(new Map<StickerId, HTMLSpanElement>());
  const handArt = useRef<HTMLSpanElement | null>(null);
  const sim = useRef<MobileSim | null>(null);
  const flights = useRef(new Map<StickerId, AnimationPlaybackControls>());
  // Measured just before a sticker changes place, consumed after the commit.
  const pendingFlip = useRef<{
    down: Flip | null;
    up: Flip | null;
    focusStory: boolean;
  } | null>(null);
  const wind = useRef({
    x: 0,
    y: 0,
    t: 0,
    checked: 0,
  });
  const sheetDrag = useRef({
    pointer: -1,
    y: 0,
  });

  const registerArm = useCallback((node: HTMLDivElement | null) => {
    if (node) armEls.current[Number(node.dataset.arm)] = node;
  }, []);
  const registerSwing = useCallback((node: HTMLDivElement | null) => {
    if (node) swingEls.current[Number(node.dataset.leaf)] = node;
  }, []);
  const registerLeafButton = useCallback((node: HTMLButtonElement | null) => {
    if (!node) return;
    const id = node.dataset.id as StickerId;
    leafButtons.current.set(id, node);
    return () => {
      leafButtons.current.delete(id);
    };
  }, []);
  const registerLeafArt = useCallback((node: HTMLSpanElement | null) => {
    if (!node) return;
    const id = node.dataset.stickerArt as StickerId;
    leafArt.current.set(id, node);
    return () => {
      leafArt.current.delete(id);
    };
  }, []);
  const registerHandArt = useCallback((node: HTMLSpanElement | null) => {
    handArt.current = node;
  }, []);

  const stopFlight = useCallback((id: StickerId) => {
    flights.current.get(id)?.stop();
    flights.current.delete(id);
  }, []);

  // Takes a sticker down (or puts the open one back when id is null).
  const show = useCallback(
    (id: StickerId | null, focusStory: boolean) => {
      if (id === handId) return;
      const down =
        id && leafArt.current.get(id)
          ? {
              id,
              from: leafArt.current.get(id)?.getBoundingClientRect() as Rect,
            }
          : null;
      const up =
        handId && handArt.current
          ? {
              id: handId,
              from: handArt.current.getBoundingClientRect() as Rect,
            }
          : null;
      pendingFlip.current = {
        down,
        up,
        focusStory,
      };
      setHandId(id);
    },
    [
      handId,
    ],
  );

  const putBack = useCallback(() => {
    if (!handId) return;
    const leaf = leafButtons.current.get(handId);
    const inPanel = !rootRef.current
      ?.querySelector("[data-stage]")
      ?.contains(document.activeElement);
    show(null, false);
    if (inPanel) {
      leaf?.focus({
        preventScroll: true,
      });
    }
  }, [
    handId,
    show,
  ]);

  const close = useCallback(() => {
    // Every sticker flies home from a clean hook: settle the one in hand back
    // onto its thread, and end any flight mid-air.
    for (const [id, flight] of flights.current) {
      flight.stop();
      flights.current.delete(id);
    }
    pendingFlip.current = null;
    if (handId) flushSync(() => setHandId(null));
    for (const node of leafArt.current.values()) node.style.transform = "";
    onClose();
  }, [
    handId,
    onClose,
  ]);

  const onLeafClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const id = event.currentTarget.dataset.id as StickerId;
      if (id === handId) {
        show(null, false);
        return;
      }
      show(id, true);
    },
    [
      handId,
      show,
    ],
  );

  const step = useCallback(
    (direction: -1 | 1) => {
      if (!handId) return;
      const index = ORDER.indexOf(handId);
      const next = ORDER[(index + direction + ORDER.length) % ORDER.length];
      show(next, false);
    },
    [
      handId,
      show,
    ],
  );

  const onPrev = useCallback(
    () => step(-1),
    [
      step,
    ],
  );
  const onNext = useCallback(
    () => step(1),
    [
      step,
    ],
  );
  const onPutBack = useCallback(
    () => putBack(),
    [
      putBack,
    ],
  );

  // Empty space steps back a level: the sheet closes, then the mobile.
  const onBackdropClick = useCallback(() => {
    if (handId) putBack();
    else close();
  }, [
    handId,
    putBack,
    close,
  ]);

  // A quick pointer past a hanging sticker nudges it like a draft.
  const onWind = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const w = wind.current;
      const now = event.timeStamp;
      const dt = now - w.t;
      if (w.t && dt > 0 && dt < 120 && sim.current) {
        const vx = (event.clientX - w.x) / dt;
        const vy = (event.clientY - w.y) / dt;
        const speed = Math.hypot(vx, vy);
        if (speed > WIND_MIN_SPEED && now - w.checked > WIND_CHECK_MS) {
          w.checked = now;
          for (const leaf of LEAVES) {
            if (leaf.sticker.id === handId) continue;
            const button = leafButtons.current.get(leaf.sticker.id);
            if (!button) continue;
            const rect = button.getBoundingClientRect();
            const c = centre(rect);
            const reach = rect.width * 1.15;
            const distance = Math.hypot(
              event.clientX - c.x,
              event.clientY - c.y,
            );
            if (distance > reach) continue;
            const falloff = 1 - distance / reach;
            sim.current.nudgeLeaf(leaf.index, vx * WIND_LEAF_GAIN * falloff);
            // A pushed thread lifts its sticker a little, so the other end of
            // the arm sinks: left-hand leaves tip the arm clockwise.
            sim.current.nudgeArm(
              LEAF_PARENT[leaf.index],
              Math.abs(vx) *
                WIND_ARM_GAIN *
                falloff *
                (leaf.index % 2 ? -1 : 1),
            );
          }
        }
      }
      w.x = event.clientX;
      w.y = event.clientY;
      w.t = now;
    },
    [
      handId,
    ],
  );

  // Drag the sheet handle down to put the sticker back.
  const onHandlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      sheetDrag.current = {
        pointer: event.pointerId,
        y: event.clientY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );
  const onHandlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = sheetDrag.current;
      if (drag.pointer !== event.pointerId) return;
      if (event.clientY - drag.y > SHEET_DISMISS_PX) {
        drag.pointer = -1;
        putBack();
      }
    },
    [
      putBack,
    ],
  );
  const onHandlePointerEnd = useCallback(() => {
    sheetDrag.current.pointer = -1;
  }, []);

  useEffect(() => {
    rootRef.current?.focus({
      preventScroll: true,
    });
  }, []);

  // The physics loop. It stays asleep until the morph has landed, then hangs
  // the mobile with a top-down kick.
  useEffect(() => {
    const created = createMobileSim({
      arms: armEls.current,
      swings: swingEls.current,
      reduceMotion,
    });
    sim.current = created;
    created.setTargets(armTargets(new Set()));
    const timer = window.setTimeout(() => {
      setLive(true);
      created.hang();
    }, SETTLE_MS);
    return () => {
      window.clearTimeout(timer);
      created.destroy();
      sim.current = null;
    };
  }, [
    reduceMotion,
  ]);

  // The rebalancing: with one sticker in hand, every arm above it has a new
  // resting angle, and the loop swings the structure there.
  useEffect(() => {
    sim.current?.setTargets(
      armTargets(
        new Set(
          handId
            ? [
                handId,
              ]
            : [],
        ),
      ),
    );
  }, [
    handId,
  ]);

  // The float down and the rise back up, measured across the commit.
  useLayoutEffect(() => {
    const flip = pendingFlip.current;
    pendingFlip.current = null;
    if (!flip) return;
    if (!reduceMotion) {
      if (flip.down && handArt.current) {
        stopFlight(flip.down.id);
        flights.current.set(
          flip.down.id,
          fly(handArt.current, flip.down.from, {
            stiffness: 150,
            damping: 16,
          }),
        );
      }
      if (flip.up) {
        const node = leafArt.current.get(flip.up.id);
        if (node) {
          stopFlight(flip.up.id);
          flights.current.set(
            flip.up.id,
            fly(node, flip.up.from, {
              stiffness: 210,
              damping: 22,
            }),
          );
        }
      }
    }
    if (flip.focusStory) {
      headingRef.current?.focus({
        preventScroll: true,
      });
    }
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (handId) putBack();
        else close();
        return;
      }
      if (
        ![
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
        ].includes(event.key)
      ) {
        return;
      }
      event.preventDefault();
      const focused =
        document.activeElement instanceof HTMLElement
          ? (document.activeElement.dataset.id as StickerId | undefined)
          : undefined;
      const current = handId ?? focused;
      const index = current ? ORDER.indexOf(current) : -1;
      let next: number;
      if (event.key === "Home") next = 0;
      else if (event.key === "End") next = ORDER.length - 1;
      else if (index === -1)
        next = event.key === "ArrowLeft" ? ORDER.length - 1 : 0;
      else
        next =
          (index + (event.key === "ArrowLeft" ? -1 : 1) + ORDER.length) %
          ORDER.length;
      const nextId = ORDER[next];
      if (handId) {
        // The story remounts per sticker, so focus inside it moves to the new
        // heading rather than dropping to the page.
        const inPanel =
          !focused &&
          (rootRef.current
            ?.querySelector("[data-panel]")
            ?.contains(document.activeElement) ??
            false);
        if (nextId !== handId) show(nextId, inPanel);
        // Reading the story keeps the keyboard there; browsing the mobile
        // follows the sticker that just came down.
        if (focused) {
          leafButtons.current.get(nextId)?.focus({
            preventScroll: true,
          });
        }
        return;
      }
      leafButtons.current.get(nextId)?.focus({
        preventScroll: true,
      });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    handId,
    putBack,
    close,
    show,
  ]);

  const hand = STICKERS.find((sticker) => sticker.id === handId);
  const handIndex = hand ? ORDER.indexOf(hand.id) : -1;

  const renderLeaf = (node: LeafNode, depth: number) => {
    const { sticker, index } = node;
    const taken = sticker.id === handId;
    const [period, amp] = LEAF_DRIFT[index];
    return (
      <div
        ref={registerSwing}
        data-leaf={index}
        className={styles.swing}
        style={
          {
            "--len": node.thread,
            "--period": `${period}s`,
            "--amp": `${amp}deg`,
            "--delay": `${depth * ENTRANCE_STAGGER_MS}ms`,
          } as CSSProperties
        }
      >
        <div className={styles.leafDrift}>
          <span aria-hidden="true" className={styles.thread} />
          <button
            ref={registerLeafButton}
            type="button"
            data-id={sticker.id}
            aria-pressed={taken}
            aria-label={
              taken
                ? `Hang the ${sticker.label} back up`
                : `${sticker.label}, ${index + 1} of ${STICKERS.length}. Take it down to read its story`
            }
            className={styles.leaf}
            onClick={onLeafClick}
          >
            {taken ? (
              <span
                aria-hidden="true"
                className={styles.ghost}
                style={fit(sticker)}
              />
            ) : (
              <StickerArt
                sticker={sticker}
                className={styles.art}
                register={registerLeafArt}
              />
            )}
          </button>
          <span
            aria-hidden="true"
            className={cn(
              styles.tag,
              "font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase",
            )}
          >
            {sticker.label}
          </span>
        </div>
      </div>
    );
  };

  const renderArm = (node: ArmNode, depth: number) => {
    const [period, amp] = ARM_DRIFT[node.index];
    const delay = `${depth * ENTRANCE_STAGGER_MS}ms`;
    return (
      <div className={styles.hook}>
        <span
          aria-hidden="true"
          className={styles.thread}
          style={
            {
              "--len": node.drop,
              "--delay": delay,
            } as CSSProperties
          }
        />
        <div
          ref={registerArm}
          data-arm={node.index}
          className={styles.arm}
          style={
            {
              "--span": node.span,
              "--drop": node.drop,
              "--pivot": node.pivot,
              "--period": `${period}s`,
              "--amp": `${amp}deg`,
              "--delay": delay,
            } as CSSProperties
          }
        >
          <div className={styles.drift}>
            <span aria-hidden="true" className={styles.beam} />
            <span aria-hidden="true" className={styles.pivotDot} />
            <div className={cn(styles.end, styles.endLeft)}>
              {renderNode(node.left, depth + 1)}
            </div>
            <div className={cn(styles.end, styles.endRight)}>
              {renderNode(node.right, depth + 1)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNode = (node: ArmNode | LeafNode, depth: number) =>
    node.kind === "arm" ? renderArm(node, depth) : renderLeaf(node, depth);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Sticker mobile"
      tabIndex={-1}
      data-live={live ? "" : undefined}
      className={cn(
        styles.root,
        "fixed inset-0 z-40 flex flex-col overflow-hidden overscroll-contain outline-none select-none",
      )}
      style={
        {
          "--depth": TREE_DEPTH,
        } as CSSProperties
      }
      onPointerMove={onWind}
    >
      <div
        aria-hidden="true"
        className={cn(
          styles.backdrop,
          "absolute inset-0 touch-none bg-background/75 backdrop-blur-xl backdrop-saturate-150",
        )}
        onClick={onBackdropClick}
      />

      <header className="pointer-events-none relative z-10 flex shrink-0 items-start justify-between gap-4 px-5 pt-[76px] sm:px-8 sm:pt-6">
        <div>
          <h2 className="list-heading text-[2rem] text-foreground">Mobile</h2>
          <p className="mt-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
            Eight keepsakes in balance
          </p>
        </div>
        <button
          type="button"
          aria-label="Close the sticker mobile"
          className={cn(
            iconButtonClassName,
            "pointer-events-auto bg-foreground/5",
          )}
          onClick={close}
        >
          <RiCloseLine aria-hidden="true" className="size-5" />
        </button>
      </header>

      <div className="pointer-events-none relative z-10 mx-auto flex min-h-0 w-full max-w-176 flex-1 flex-col px-6 sm:px-8">
        <div
          data-stage
          className={cn(styles.stage, "pointer-events-auto mt-2 shrink-0")}
        >
          <span aria-hidden="true" className={styles.ceiling} />
          {renderArm(ROOT, 0)}
        </div>

        <div className="relative min-h-0 flex-1 pt-5 pb-6 sm:pt-7">
          {hand ? (
            <section
              data-panel
              aria-label={`The ${hand.label} story`}
              className={cn(styles.sheet, styles.panel, "pointer-events-auto")}
            >
              <div
                className={cn(
                  styles.handle,
                  "flex justify-center py-2 touch-none",
                )}
                aria-hidden="true"
                onPointerDown={onHandlePointerDown}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerEnd}
                onPointerCancel={onHandlePointerEnd}
              >
                <span className="block h-1 w-9 rounded-full bg-foreground/20" />
              </div>
              <StickerArt
                sticker={hand}
                className={styles.handArt}
                register={registerHandArt}
                hiRes
              />
              <div
                className={cn(
                  styles.head,
                  styles.rise,
                  "flex min-w-0 items-start justify-between gap-3",
                )}
              >
                <div className="min-w-0 pt-1">
                  <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                    {counter(handIndex)}
                  </p>
                  <h2
                    ref={headingRef}
                    tabIndex={-1}
                    className="list-heading mt-1 text-[2rem] text-foreground outline-none"
                  >
                    {hand.label}
                  </h2>
                </div>
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    aria-label="Previous sticker"
                    className={iconButtonClassName}
                    onClick={onPrev}
                  >
                    <RiArrowLeftLine aria-hidden="true" className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next sticker"
                    className={iconButtonClassName}
                    onClick={onNext}
                  >
                    <RiArrowRightLine aria-hidden="true" className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Hang it back up"
                    className={cn(iconButtonClassName, "hidden sm:inline-flex")}
                    onClick={onPutBack}
                  >
                    <RiCloseLine aria-hidden="true" className="size-5" />
                  </button>
                </div>
              </div>
              <div
                key={hand.id}
                // biome-ignore lint/a11y/noNoninteractiveTabindex: the story scrolls, so keyboard users need a stop to scroll it.
                tabIndex={0}
                className={cn(
                  styles.story,
                  styles.rise,
                  "mt-3 min-h-0 overflow-y-auto overscroll-contain pr-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                <p className="max-w-[62ch] cursor-text text-[15px] leading-[1.7] text-pretty whitespace-pre-line text-foreground select-text">
                  {hand.story}
                </p>
              </div>
            </section>
          ) : (
            <p
              className={cn(
                styles.hint,
                "pointer-events-none text-center font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase",
              )}
            >
              Take one down to read its story
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
