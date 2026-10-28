"use client";

import { useReducedMotion } from "framer-motion";
import Image, { getImageProps } from "next/image";
import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { STICKERS, type StickerDefinition } from "@/components/sticker-data";
import { playSound } from "@/lib/sound";
import styles from "./backing-paper.module.css";
import { ARTBOARD, FRAMES, HINT_ID, type StickerId } from "./frames";
import {
  heldTransform,
  hinge,
  peelOff,
  pressBack,
  SHADOW_HELD,
  tiltAxis,
} from "./peel";
import {
  getPeeled,
  getServerPeeled,
  markPeeled,
  resetSheet,
  subscribePeeled,
} from "./sheet-store";

// An inline sheet in the home column: nothing fixed on screen, so the picker
// can sit at the top out of the way of the liner.
// biome-ignore lint/style/useComponentExportOnlyModules: read by the prototype registry.
export const kind = "inline";
// biome-ignore lint/style/useComponentExportOnlyModules: read by the prototype registry.
export const pickerPosition: "top" | "bottom" = "top";

const ORDER = STICKERS.map((sticker) => sticker.id);
const BY_ID = new Map(
  STICKERS.map((sticker) => [
    sticker.id,
    sticker,
  ]),
);
const TOTAL = String(STICKERS.length).padStart(2, "0");
const LINER_ID = "backing-paper-liner";
const NONE: ReadonlySet<StickerId> = new Set();
const SHEET_SIZES = "(min-width: 640px) 180px, 45vw";
const HELD_SIZES = "(min-width: 640px) 240px, 160px";
// Largest side of the sticker resting on the liner.
const HELD_WIDE = 196;
const HELD_NARROW = 132;

function number(id: StickerId) {
  return String(ORDER.indexOf(id) + 1).padStart(2, "0");
}

function paragraphs(story: string) {
  return story.split("\n\n");
}

function percent(value: number, of: number) {
  return `${(value / of) * 100}%`;
}

// The hole is the sticker's own silhouette: a small optimised rendition of
// the same PNG, used as a mask.
function maskOf(sticker: StickerDefinition) {
  const { props } = getImageProps({
    src: sticker.src,
    alt: "",
    width: 192,
    height: Math.round((192 * sticker.height) / sticker.width),
  });
  return `url("${props.src}")`;
}

function fitWithin(sticker: StickerDefinition, side: number) {
  const ratio = sticker.width / sticker.height;
  return ratio >= 1
    ? [
        side,
        side / ratio,
      ]
    : [
        side * ratio,
        side,
      ];
}

function cellStyle(sticker: StickerDefinition) {
  const frame = FRAMES[sticker.id];
  const [ax, ay] = tiltAxis(frame.corner);
  const { wide, narrow } = ARTBOARD;
  return {
    "--ratio": `${sticker.width} / ${sticker.height}`,
    "--wx": percent(frame.wide.x, wide.w),
    "--wy": percent(frame.wide.y, wide.h),
    "--ww": percent(frame.wide.w, wide.w),
    "--nx": percent(frame.narrow.x, narrow.w),
    "--ny": percent(frame.narrow.y, narrow.h),
    "--nw": percent(frame.narrow.w, narrow.w),
    "--hinge": hinge(frame.corner),
    "--ax": ax,
    "--ay": ay,
    "--rx": `${frame.restick.x}px`,
    "--ry": `${frame.restick.y}px`,
    "--rr": `${frame.restick.r}deg`,
    "--mask": maskOf(sticker),
  } as CSSProperties;
}

function heldStyle(sticker: StickerDefinition) {
  const [ww, wh] = fitWithin(sticker, HELD_WIDE);
  const [nw, nh] = fitWithin(sticker, HELD_NARROW);
  return {
    "--held-ww": `${ww}px`,
    "--held-wh": `${wh}px`,
    "--held-nw": `${nw}px`,
    "--held-nh": `${nh}px`,
  } as CSSProperties;
}

function cavityStyle(id: StickerId) {
  const cavity = FRAMES[id].cavity;
  if (!cavity) return undefined;
  return {
    top: `${cavity.top}%`,
    right: `${cavity.right}%`,
    bottom: `${cavity.bottom}%`,
    left: `${cavity.left}%`,
  } satisfies CSSProperties;
}

type Return = {
  id: StickerId;
  clone: HTMLElement;
  from: DOMRect;
  current: string;
};

export default function BackingPaper() {
  const reduceMotion = useReducedMotion() ?? false;
  const peeled = useSyncExternalStore(
    subscribePeeled,
    getPeeled,
    getServerPeeled,
  );
  const [openId, setOpenId] = useState<StickerId | null>(null);
  // What the liner shows while it folds away after a close.
  const [lastId, setLastId] = useState<StickerId | null>(null);
  const [returning, setReturning] = useState<ReadonlySet<StickerId>>(NONE);
  // Cavity stories that turned out not to fit at this size.
  const [cramped, setCramped] = useState<ReadonlySet<StickerId>>(NONE);
  const [pointed, setPointed] = useState<StickerId | null>(null);

  const cells = useRef(new Map<StickerId, HTMLButtonElement>());
  const heldSlotRef = useRef<HTMLDivElement>(null);
  const heldArtRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cavityRef = useRef<HTMLDivElement>(null);
  const linerRef = useRef<HTMLElement>(null);
  const flightRef = useRef<{
    id: StickerId;
    from: DOMRect;
  } | null>(null);
  const returnsRef = useRef<Return[]>([]);
  const clonesRef = useRef(new Set<HTMLElement>());
  const focusStoryRef = useRef(false);
  const heardRef = useRef(false);

  const inCavity = (id: StickerId | null) =>
    id !== null && FRAMES[id].cavity !== undefined && !cramped.has(id);

  // Takes the held sticker off the liner as a loose copy so it can fly home
  // while React is already showing the next one (or nothing).
  const releaseHeld = useCallback(
    (id: StickerId) => {
      playSound("stickerPlace");
      const art = heldArtRef.current;
      const slot = heldSlotRef.current;
      if (reduceMotion || !art || !slot) return;
      const from = slot.getBoundingClientRect();
      const current = getComputedStyle(art).transform;
      const clone = art.cloneNode(true) as HTMLElement;
      clone.removeAttribute("id");
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
      Object.assign(clone.style, {
        position: "fixed",
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
        zIndex: "40",
        pointerEvents: "none",
        transform: current,
      });
      document.body.append(clone);
      clonesRef.current.add(clone);
      returnsRef.current.push({
        id,
        clone,
        from,
        current,
      });
      setReturning((previous) => new Set(previous).add(id));
    },
    [
      reduceMotion,
    ],
  );

  const peel = useCallback(
    (id: StickerId) => {
      if (openId === id) return;
      if (openId) releaseHeld(openId);
      const cell = cells.current.get(id);
      flightRef.current = cell
        ? {
            id,
            from: cell.getBoundingClientRect(),
          }
        : null;
      focusStoryRef.current = true;
      playSound("stickerLift");
      setOpenId(id);
      setLastId(id);
      markPeeled(id);
    },
    [
      openId,
      releaseHeld,
    ],
  );

  const close = useCallback(
    (returnFocus = true) => {
      if (!openId) return;
      releaseHeld(openId);
      if (returnFocus)
        cells.current.get(openId)?.focus({
          preventScroll: true,
        });
      setOpenId(null);
    },
    [
      openId,
      releaseHeld,
    ],
  );

  const step = useCallback(
    (delta: number) => {
      const from = openId ?? lastId ?? ORDER[0];
      const index = ORDER.indexOf(from);
      peel(ORDER[(index + delta + ORDER.length) % ORDER.length]);
    },
    [
      openId,
      lastId,
      peel,
    ],
  );

  const newSheet = () => {
    close(false);
    resetSheet();
    playSound("tap");
  };

  // Flights run after React has moved the sticker: the held copy exists on
  // the liner and the cell shows its hole, so both ends can be measured.
  useLayoutEffect(() => {
    for (const { id, clone, from, current } of returnsRef.current.splice(0)) {
      const cell = cells.current.get(id);
      const done = () => {
        clone.remove();
        clonesRef.current.delete(clone);
        setReturning((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      };
      if (!cell) {
        done();
        continue;
      }
      pressBack(
        clone,
        from,
        cell.getBoundingClientRect(),
        FRAMES[id],
        current,
      ).finished.then(done, done);
    }

    const flight = flightRef.current;
    flightRef.current = null;
    const art = heldArtRef.current;
    const slot = heldSlotRef.current;
    if (!flight || flight.id !== openId || !art || !slot) return;
    if (reduceMotion) {
      art.animate(
        {
          opacity: [
            0,
            1,
          ],
        },
        {
          duration: 120,
          easing: "linear",
        },
      );
      return;
    }
    peelOff(
      art,
      flight.from,
      slot.getBoundingClientRect(),
      FRAMES[flight.id].corner,
    );
  }, [
    openId,
    reduceMotion,
  ]);

  // A cavity story that overflows its frame (a narrow phone, a large default
  // font) goes to the liner instead of being cut off.
  useLayoutEffect(() => {
    const cavity = cavityRef.current;
    if (!openId || !cavity || cramped.has(openId)) return;
    if (cavity.scrollHeight > cavity.clientHeight + 1) {
      setCramped((previous) => new Set(previous).add(openId));
    }
  }, [
    openId,
    cramped,
  ]);

  useEffect(() => {
    const onResize = () => setCramped(NONE);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // After a peel, reading starts at the liner heading.
  useEffect(() => {
    if (!openId || !focusStoryRef.current) return;
    focusStoryRef.current = false;
    headingRef.current?.focus({
      preventScroll: true,
    });
    // Once the liner has unfolded, bring it into view if it opened below
    // the fold.
    const timer = window.setTimeout(
      () => {
        (cavityRef.current ?? linerRef.current)?.scrollIntoView({
          block: "nearest",
          behavior: reduceMotion ? "auto" : "smooth",
        });
      },
      reduceMotion ? 0 : 400,
    );
    return () => window.clearTimeout(timer);
  }, [
    openId,
    reduceMotion,
  ]);

  useEffect(() => {
    const clones = clonesRef.current;
    return () => {
      for (const clone of clones) clone.remove();
    };
  }, []);

  // Arrows only move while focus is inside the sheet or the liner; the
  // picker keeps the page-level keys.
  const onSheetKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const id = (event.target as HTMLElement).dataset.sticker as
      | StickerId
      | undefined;
    if (event.key === "Escape" && openId) {
      event.preventDefault();
      close();
      return;
    }
    if (!id) return;
    const index = ORDER.indexOf(id);
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = (index + 1) % ORDER.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index - 1 + ORDER.length) % ORDER.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ORDER.length - 1;
    if (next === null) return;
    event.preventDefault();
    cells.current.get(ORDER[next])?.focus();
  };

  const idOf = (event: SyntheticEvent<HTMLElement>) =>
    event.currentTarget.dataset.sticker as StickerId;

  const registerCell = useCallback((node: HTMLButtonElement | null) => {
    if (node) cells.current.set(node.dataset.sticker as StickerId, node);
  }, []);

  const onCellClick = (event: MouseEvent<HTMLButtonElement>) => {
    const id = idOf(event);
    if (openId === id) close();
    else peel(id);
  };

  const onCellEnter = (event: SyntheticEvent<HTMLButtonElement>) =>
    setPointed(idOf(event));

  const onCellLeave = (event: SyntheticEvent<HTMLButtonElement>) => {
    const id = idOf(event);
    setPointed((current) => (current === id ? null : current));
  };

  // One quiet tick the first time a pointer finds the sheet, not on every
  // sticker it crosses.
  const onSheetEnter = () => {
    if (heardRef.current) return;
    heardRef.current = true;
    playSound("hover");
  };

  const pressBackOpen = () => close();
  const stepBack = () => step(-1);
  const stepOn = () => step(1);

  const onLinerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };

  const shownId = openId ?? lastId;
  const shown = shownId ? BY_ID.get(shownId) : undefined;
  const open = openId ? BY_ID.get(openId) : undefined;
  const pointedSticker = pointed ? BY_ID.get(pointed) : undefined;

  return (
    <section
      className={styles.root}
      aria-label="Sticker sheet"
      data-open={openId ? "" : undefined}
    >
      <div className={styles.sheet} onPointerEnter={onSheetEnter}>
        <p className={styles.masthead}>
          <span>Sheet 01 · Eight die-cuts · Saeed</span>
          <span aria-hidden className={styles.register} />
        </p>
        <ul
          className={styles.board}
          aria-label="Eight die-cut stickers"
          onKeyDown={onSheetKeyDown}
        >
          {STICKERS.map((sticker) => {
            const id = sticker.id;
            const isOpen = openId === id;
            const away = isOpen || returning.has(id);
            const isRead = peeled.has(id) && !away;
            return (
              <li
                key={id}
                className={styles.cell}
                style={cellStyle(sticker)}
                data-away={away || undefined}
                data-read={isRead || undefined}
                data-hint={
                  (id === HINT_ID && !peeled.has(id) && !away) || undefined
                }
              >
                <span aria-hidden className={styles.holeEdge}>
                  <span className={styles.hole}>
                    <span className={styles.holeFloor} />
                  </span>
                </span>
                <button
                  ref={registerCell}
                  type="button"
                  className={styles.peel}
                  data-sticker={id}
                  aria-label={
                    isOpen
                      ? `Press the ${sticker.label} back`
                      : `Peel the ${sticker.label}`
                  }
                  aria-expanded={isOpen}
                  aria-controls={LINER_ID}
                  onClick={onCellClick}
                  onPointerEnter={onCellEnter}
                  onPointerLeave={onCellLeave}
                  onFocus={onCellEnter}
                  onBlur={onCellLeave}
                >
                  <span className={styles.art}>
                    <Image
                      src={sticker.src}
                      alt=""
                      fill
                      sizes={SHEET_SIZES}
                      draggable={false}
                    />
                  </span>
                </button>
                {isOpen && inCavity(id) ? (
                  // Printed on the liner inside the hole. The liner below
                  // carries the same words for assistive tech.
                  <div
                    ref={cavityRef}
                    aria-hidden
                    className={styles.cavity}
                    style={cavityStyle(id)}
                  >
                    <p className={styles.cavityCaption}>
                      No. {number(id)} · {sticker.label}
                    </p>
                    {paragraphs(sticker.story).map((text) => (
                      <p key={text}>{text}</p>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className={styles.foot}>
          <p className={styles.instruction}>Peel a corner.</p>
          <p aria-hidden className={styles.caption}>
            {pointedSticker
              ? `${number(pointedSticker.id)} · ${pointedSticker.label}`
              : null}
          </p>
          {peeled.size > 0 ? (
            <button
              type="button"
              className={styles.newSheet}
              onClick={newSheet}
            >
              new sheet
            </button>
          ) : null}
        </div>
      </div>

      <section
        ref={linerRef}
        aria-label="Liner"
        className={styles.liner}
        data-open={openId ? "" : undefined}
        onKeyDown={onLinerKeyDown}
      >
        {open ? (
          <div
            key={open.id}
            ref={heldSlotRef}
            className={styles.heldSlot}
            style={heldStyle(open)}
          >
            <button
              ref={heldArtRef}
              type="button"
              tabIndex={-1}
              aria-label={`Press the ${open.label} back`}
              className={styles.heldArt}
              style={{
                transformOrigin: hinge(FRAMES[open.id].corner),
                transform: heldTransform(FRAMES[open.id].corner),
                filter: SHADOW_HELD,
              }}
              onClick={pressBackOpen}
            >
              <Image
                src={open.src}
                alt=""
                fill
                sizes={HELD_SIZES}
                draggable={false}
              />
            </button>
          </div>
        ) : null}
        <div id={LINER_ID} className={styles.panel} inert={!openId}>
          <div className={styles.clip}>
            {shown ? (
              <div
                key={shown.id}
                className={styles.linerBody}
                style={heldStyle(shown)}
              >
                <span aria-hidden className={styles.heldSpace} />
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className={styles.linerHeading}
                >
                  <span className={styles.count}>
                    {number(shown.id)} / {TOTAL}
                  </span>
                  <span className={styles.title}>{shown.label}</span>
                  <span className={styles.provenance}>
                    {FRAMES[shown.id].provenance}
                  </span>
                </h2>
                <div className={inCavity(shown.id) ? "sr-only" : styles.story}>
                  {paragraphs(shown.story).map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                </div>
                {inCavity(shown.id) ? (
                  <p aria-hidden className={styles.pointer}>
                    Printed on the sheet, where it sat.
                  </p>
                ) : null}
                <div className={styles.controls}>
                  <button
                    type="button"
                    className={styles.control}
                    onClick={stepBack}
                  >
                    ← prev
                  </button>
                  <button
                    type="button"
                    className={styles.control}
                    onClick={stepOn}
                  >
                    next die-cut →
                  </button>
                  <button
                    type="button"
                    className={styles.control}
                    onClick={pressBackOpen}
                  >
                    press back
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}
