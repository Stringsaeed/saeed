"use client";

import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCloseLine,
} from "@remixicon/react";
import Image from "next/image";
import {
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  ViewTransition,
} from "react";
import { flushSync } from "react-dom";
import {
  STICKERS,
  type StickerDefinition,
  stickerTransitionName,
} from "@/components/sticker-data";
import { STICKER_ART_SIZES } from "@/components/sticker-transition";
import { useStoryReadTracking } from "@/lib/desk-experiment";
import { cn } from "@/lib/utils";
import {
  CODA,
  floorPath,
  type Geometry,
  inkFrame,
  MILESTONES,
  measure,
  overviewPoint,
  type StickerId,
  WALK,
  WORD_BOX,
  WORD_DOTS,
  WORD_PATH,
  walkPoint,
} from "./geometry";
import styles from "./long-take.module.css";

type StickerLongTakeProps = {
  onClose: () => void;
};

const BY_ID = Object.fromEntries(
  STICKERS.map((sticker) => [
    sticker.id,
    sticker,
  ]),
) as Record<StickerId, StickerDefinition>;

const TOTAL = String(WALK.length).padStart(2, "0");
const HI_RES_SIZES = "240px";
const DRAG_SLOP = 6;
// The camera has reached a stop when it rests this close to it, and has
// left it once it drifts further than LEAVE.
const PARK = 0.02;
const LEAVE = 0.06;
const SETTLE_MS = 140;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useReducedMotionPreference() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;
const smooth = (value: number) => value * value * (3 - 2 * value);

function stopNumber(index: number) {
  return `${String(index + 1).padStart(2, "0")} / ${TOTAL}`;
}

function markLoaded(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.dataset.loaded = "";
}

const roundButton =
  "pointer-events-auto inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground transition-colors hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const pillButton =
  "pointer-events-auto inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground/5 px-5 font-mono text-[11px] tracking-[0.12em] text-foreground uppercase transition-colors hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-35";

type Drag = {
  id: number;
  x: number;
  top: number;
  moved: boolean;
  lastX: number;
  lastT: number;
  velocity: number;
};

export function StickerLongTake({ onClose }: StickerLongTakeProps) {
  const reduced = useReducedMotionPreference();
  const storyId = useId();
  // Nearest step on the walk (0–7 the stops, 8 the end); the step itself
  // when motion is reduced.
  const [current, setCurrent] = useState(0);
  // The stop whose story is open, while walking.
  const [parked, setParked] = useState<number | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [hiRes, setHiRes] = useState(false);
  const [closing, setClosing] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<SVGSVGElement>(null);
  const floorPathRef = useRef<SVGPathElement>(null);
  const inkRef = useRef<SVGSVGElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const stopRefs = useRef<(HTMLLIElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const geoRef = useRef<Geometry | null>(null);
  const progressRef = useRef(0);
  const currentRef = useRef(0);
  const parkedRef = useRef<number | null>(null);
  const arrivedRef = useRef<number | null>(null);
  const focusStoryOnArrive = useRef(false);
  const settleTimer = useRef(0);
  const dragRef = useRef<Drag | null>(null);
  const suppressClickUntil = useRef(0);

  // Writes every stop's place straight to the DOM, so walking never
  // re-renders React. `progress` is the camera position in stops.
  const paint = useCallback((progress: number) => {
    const geo = geoRef.current;
    const root = rootRef.current;
    if (!geo || !root) return;
    const step = Math.round(progress);
    const t = geo.reduced ? 1 : smooth(clamp(progress - (CODA - 1), 0, 1));
    const overScale = geo.overSize / geo.box;
    for (let index = 0; index < WALK.length; index++) {
      const stop = stopRefs.current[index];
      if (!stop) continue;
      const over = overviewPoint(geo, index);
      let x = over.x;
      let y = over.y;
      let scale = overScale;
      let opacity: number;
      let glow: number;
      if (geo.reduced) {
        const atEnd = step === CODA;
        opacity = atEnd ? 0.8 : index === step ? 1 : 0.32;
        glow = atEnd ? 0.85 : index === step ? 1 : 0;
      } else {
        const walk = walkPoint(geo, index, progress);
        const distance = Math.min(Math.abs(index - progress), 2);
        const near = Math.min(distance, 1);
        const far = Math.max(0, distance - 1);
        x = lerp(walk.x, over.x, t);
        y = lerp(walk.y, over.y, t);
        scale = lerp(1 - 0.16 * near - 0.08 * far, overScale, t);
        opacity = lerp(1 - 0.55 * near - 0.2 * far, 0.72, t);
        glow = lerp(clamp(1 - distance * 1.2, 0, 1), 0.85, t);
      }
      stop.style.transform = `translate3d(${(x - geo.box / 2).toFixed(1)}px, ${(y - geo.box / 2).toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
      stop.style.opacity = opacity.toFixed(3);
      stop.style.setProperty("--glow", glow.toFixed(3));
    }
    const floor = floorRef.current;
    if (floor) {
      const x = geo.vertical ? geo.focusX : geo.focusX - progress * geo.gap;
      const y = geo.vertical ? geo.focusY - progress * geo.gap : geo.focusY;
      floor.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      floor.style.opacity = geo.reduced ? "0" : (1 - t).toFixed(3);
    }
    root.style.setProperty("--t", t.toFixed(3));
  }, []);

  const layout = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const previous = geoRef.current;
    const geo = measure(window.innerWidth, window.innerHeight, reduced);
    geoRef.current = geo;
    const style = root.style;
    style.setProperty("--box", `${geo.box}px`);
    style.setProperty("--seg", `${geo.seg}px`);
    style.setProperty("--focus-x", `${geo.focusX}px`);
    style.setProperty("--focus-y", `${geo.focusY}px`);
    style.setProperty("--story-top", `${geo.storyTop}px`);
    style.setProperty("--story-left", `${geo.storyLeft}px`);
    style.setProperty("--story-right", `${geo.storyRight}px`);
    style.setProperty("--story-bottom", `${geo.storyBottom}px`);
    style.setProperty("--coda-top", `${geo.codaTop}px`);
    floorPathRef.current?.setAttribute("d", floorPath(geo));
    const ink = inkRef.current;
    if (ink) {
      const frame = inkFrame(geo);
      ink.style.transform = `translate3d(${frame.x.toFixed(1)}px, ${frame.y.toFixed(1)}px, 0)`;
      ink.style.width = `${frame.width.toFixed(1)}px`;
      ink.style.height = `${frame.height.toFixed(1)}px`;
      ink.style.setProperty("--ink-w", geo.inkWidth.toFixed(3));
    }
    if (geo.reduced) {
      paint(currentRef.current);
      return;
    }
    // Keep the camera on the same stop when the window changes size.
    if (previous && previous.seg !== geo.seg) {
      root.scrollTop = progressRef.current * geo.seg;
    }
    paint(progressRef.current);
  }, [
    reduced,
    paint,
  ]);

  useLayoutEffect(() => {
    layout();
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
  }, [
    layout,
  ]);

  useEffect(() => {
    rootRef.current?.focus({
      preventScroll: true,
    });
    // A sharper rendition once the stickers have landed.
    const timer = window.setTimeout(() => setHiRes(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const focusStory = useCallback(() => {
    requestAnimationFrame(() =>
      storyRef.current?.focus({
        preventScroll: true,
      }),
    );
  }, []);

  const park = useCallback((index: number) => {
    parkedRef.current = index;
    setParked(index);
    setStoryIndex(index);
  }, []);

  const unpark = useCallback((returnFocus: boolean) => {
    const index = parkedRef.current;
    if (index === null) return;
    parkedRef.current = null;
    setParked(null);
    if (storyRef.current?.contains(document.activeElement)) {
      const target = returnFocus ? buttonRefs.current[index] : rootRef.current;
      target?.focus({
        preventScroll: true,
      });
    }
  }, []);

  // Reaching a stop: its sound plays once, and its story sets beside it.
  const arrive = useCallback(
    (index: number) => {
      arrivedRef.current = index;
      if (index >= CODA) return;
      park(index);
      if (focusStoryOnArrive.current) {
        focusStoryOnArrive.current = false;
        focusStory();
      }
    },
    [
      park,
      focusStory,
    ],
  );

  const settle = useCallback(() => {
    const root = rootRef.current;
    const geo = geoRef.current;
    if (!root || !geo || dragRef.current) return;
    const progress = progressRef.current;
    const nearest = clamp(Math.round(progress), 0, CODA);
    // Snapping was lifted for a drag or a sideways swipe: glide home first.
    if (root.dataset.free !== undefined) {
      if (Math.abs(progress - nearest) > 0.004) {
        root.scrollTo({
          top: nearest * geo.seg,
          behavior: "smooth",
        });
        return;
      }
      delete root.dataset.free;
    }
    if (Math.abs(progress - nearest) <= PARK) arrive(nearest);
  }, [
    arrive,
  ]);

  const scheduleSettle = useCallback(() => {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(settle, SETTLE_MS);
  }, [
    settle,
  ]);

  const goTo = useCallback((index: number) => {
    const root = rootRef.current;
    const geo = geoRef.current;
    if (!root || !geo) return;
    root.scrollTo({
      top: clamp(index, 0, CODA) * geo.seg,
      behavior: "smooth",
    });
  }, []);

  // Reduced motion: nothing travels; the focus crossfades between stops.
  const select = useCallback(
    (index: number) => {
      const next = clamp(index, 0, CODA);
      if (next === currentRef.current) return;
      currentRef.current = next;
      setCurrent(next);
      paint(next);
    },
    [
      paint,
    ],
  );

  // The camera: native scroll drives everything, so it only works while
  // something is actually moving.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const onScroll = () => {
      const geo = geoRef.current;
      if (!geo) return;
      const progress = clamp(root.scrollTop / geo.seg, 0, CODA);
      progressRef.current = progress;
      paint(progress);
      const nearest = Math.round(progress);
      if (nearest !== currentRef.current) {
        currentRef.current = nearest;
        setCurrent(nearest);
      }
      if (
        parkedRef.current !== null &&
        Math.abs(progress - parkedRef.current) > LEAVE
      ) {
        unpark(false);
      }
      if (
        arrivedRef.current !== null &&
        Math.abs(progress - arrivedRef.current) > 0.5
      ) {
        arrivedRef.current = null;
      }
      // The end of the take: the pencil starts to write.
      if (progress > CODA - 0.04) {
        if (root.dataset.writing === undefined) {
          root.dataset.writing = "";
        }
      } else if (progress < CODA - 0.4) {
        delete root.dataset.writing;
      }
      scheduleSettle();
    };
    root.addEventListener("scroll", onScroll, {
      passive: true,
    });
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.clearTimeout(settleTimer.current);
    };
  }, [
    reduced,
    paint,
    unpark,
    scheduleSettle,
  ]);

  // Sideways trackpad swipes walk the corridor too.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const onWheel = (event: WheelEvent) => {
      const geo = geoRef.current;
      if (!geo || geo.vertical) return;
      if (
        event.target instanceof Node &&
        storyRef.current?.contains(event.target)
      ) {
        return;
      }
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      root.dataset.free = "";
      root.scrollTop += event.deltaX * (geo.seg / geo.gap);
    };
    root.addEventListener("wheel", onWheel, {
      passive: false,
    });
    return () => root.removeEventListener("wheel", onWheel);
  }, [
    reduced,
  ]);

  // Mouse drag: the corridor follows the hand, then glides to a stop.
  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const geo = geoRef.current;
      const root = rootRef.current;
      if (
        !geo ||
        !root ||
        geo.reduced ||
        geo.vertical ||
        event.pointerType !== "mouse" ||
        event.button !== 0
      ) {
        return;
      }
      if (
        event.target instanceof Element &&
        event.target.closest("[data-no-drag]")
      ) {
        return;
      }
      dragRef.current = {
        id: event.pointerId,
        x: event.clientX,
        top: root.scrollTop,
        moved: false,
        lastX: event.clientX,
        lastT: event.timeStamp,
        velocity: 0,
      };
    },
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const geo = geoRef.current;
      if (!drag || !geo || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < DRAG_SLOP) return;
        drag.moved = true;
        root.dataset.free = "";
        root.dataset.dragging = "";
      }
      root.scrollTop = drag.top - dx * (geo.seg / geo.gap);
      const dt = event.timeStamp - drag.lastT;
      if (dt > 0) {
        drag.velocity = lerp(
          drag.velocity,
          (event.clientX - drag.lastX) / dt,
          0.6,
        );
      }
      drag.lastX = event.clientX;
      drag.lastT = event.timeStamp;
    };
    const onEnd = (event: PointerEvent) => {
      const drag = dragRef.current;
      const geo = geoRef.current;
      if (!drag || event.pointerId !== drag.id) return;
      dragRef.current = null;
      if (!drag.moved || !geo) return;
      delete root.dataset.dragging;
      suppressClickUntil.current = performance.now() + 250;
      // Carry a flick a little further, then come to rest on a stop.
      const projected = progressRef.current - (drag.velocity * 180) / geo.gap;
      const target = clamp(Math.round(projected), 0, CODA);
      root.scrollTo({
        top: target * geo.seg,
        behavior: "smooth",
      });
      scheduleSettle();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [
    scheduleSettle,
  ]);

  const close = useCallback(() => {
    // Every sticker flies home whole and lit, from wherever it stands.
    flushSync(() => {
      setClosing(true);
      setParked(null);
    });
    onClose();
  }, [
    onClose,
  ]);

  const onStopClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (performance.now() < suppressClickUntil.current) return;
      const index = Number(event.currentTarget.dataset.index);
      const keyboard = event.detail === 0;
      if (reduced) {
        select(index);
        return;
      }
      if (Math.abs(progressRef.current - index) <= LEAVE) {
        if (parkedRef.current === index) {
          unpark(true);
          return;
        }
        arrive(index);
        if (keyboard) focusStory();
        return;
      }
      focusStoryOnArrive.current = keyboard;
      goTo(index);
    },
    [
      reduced,
      select,
      unpark,
      arrive,
      focusStory,
      goTo,
    ],
  );

  // Tabbing along the corridor walks the camera with the focus.
  const onStopFocus = useCallback(
    (event: FocusEvent<HTMLButtonElement>) => {
      if (reduced || !event.currentTarget.matches(":focus-visible")) return;
      const index = Number(event.currentTarget.dataset.index);
      if (Math.abs(progressRef.current - index) > LEAVE) goTo(index);
    },
    [
      reduced,
      goTo,
    ],
  );

  const onCodaFocus = useCallback(
    (event: FocusEvent<HTMLButtonElement>) => {
      if (reduced || !(event.target instanceof HTMLElement)) return;
      if (!event.target.matches(":focus-visible")) return;
      if (Math.abs(progressRef.current - CODA) > LEAVE) goTo(CODA);
    },
    [
      reduced,
      goTo,
    ],
  );

  const walkAgain = useCallback(() => {
    if (reduced) {
      select(0);
      return;
    }
    rootRef.current?.focus({
      preventScroll: true,
    });
    goTo(0);
  }, [
    reduced,
    select,
    goTo,
  ]);

  const onBackdropClick = useCallback(() => {
    if (performance.now() < suppressClickUntil.current) return;
    unpark(false);
  }, [
    unpark,
  ]);

  const onPrevious = useCallback(
    () => select(currentRef.current - 1),
    [
      select,
    ],
  );
  const onNext = useCallback(
    () => select(currentRef.current + 1),
    [
      select,
    ],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (!reduced && parkedRef.current !== null) unpark(true);
        else close();
        return;
      }
      const inStory =
        event.target instanceof Node &&
        storyRef.current?.contains(event.target);
      let target: number;
      const from = reduced
        ? currentRef.current
        : Math.round(progressRef.current);
      switch (event.key) {
        case "ArrowRight":
          target = from + 1;
          break;
        case "ArrowLeft":
          target = from - 1;
          break;
        case "ArrowDown":
          if (inStory) return;
          target = from + 1;
          break;
        case "ArrowUp":
          if (inStory) return;
          target = from - 1;
          break;
        case "Home":
          if (inStory) return;
          target = 0;
          break;
        case "End":
          if (inStory) return;
          target = CODA;
          break;
        default:
          return;
      }
      event.preventDefault();
      target = clamp(target, 0, CODA);
      if (reduced) {
        select(target);
        return;
      }
      // Keep keyboard focus with the camera.
      const focusedStop = buttonRefs.current.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      if (focusedStop !== -1 && target < CODA) {
        buttonRefs.current[target]?.focus({
          preventScroll: true,
        });
      }
      goTo(target);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    reduced,
    unpark,
    close,
    select,
    goTo,
  ]);

  const registerStop = useCallback((node: HTMLLIElement) => {
    const index = Number(node.dataset.index);
    stopRefs.current[index] = node;
    return () => {
      stopRefs.current[index] = null;
    };
  }, []);

  const registerButton = useCallback((node: HTMLButtonElement) => {
    const index = Number(node.dataset.index);
    buttonRefs.current[index] = node;
    return () => {
      buttonRefs.current[index] = null;
    };
  }, []);

  const atEnd = current === CODA;
  const storyOpen = reduced ? !atEnd : parked !== null;
  const shownIndex = reduced ? (atEnd ? storyIndex : current) : storyIndex;
  const shownId = WALK[shownIndex];
  const shown = BY_ID[shownId];
  useStoryReadTracking(storyOpen ? shownId : null);

  // Reduced motion remembers the last story so the panel never empties.
  useEffect(() => {
    if (reduced && current < CODA) setStoryIndex(current);
  }, [
    reduced,
    current,
  ]);

  const codaContent = (
    <>
      <p className="font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
        The end of the walk
      </p>
      <p className="mt-2 text-[15px] text-foreground">
        <span lang="ar" dir="rtl">
          سعيد
        </span>{" "}
        · Saeed
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          className={pillButton}
          onClick={walkAgain}
          onFocus={onCodaFocus}
        >
          Walk it again
        </button>
        <button
          type="button"
          className={pillButton}
          onClick={close}
          onFocus={onCodaFocus}
        >
          Close the desk
        </button>
      </div>
    </>
  );

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Sticker desk: one long walk"
      tabIndex={-1}
      className={cn(styles.root, "fixed inset-0 z-40 outline-none")}
      data-reduced={reduced ? "" : undefined}
      data-reading={!reduced && parked !== null ? "" : undefined}
      data-end={reduced && atEnd ? "" : undefined}
      data-closing={closing ? "" : undefined}
      onPointerDown={onPointerDown}
    >
      <div className={styles.stage}>
        <div
          aria-hidden="true"
          className={cn(
            styles.backdrop,
            "absolute inset-0 bg-background/75 backdrop-blur-xl backdrop-saturate-150",
          )}
          onClick={onBackdropClick}
        />
        <div aria-hidden="true" className={styles.ribbon} />
        <div aria-hidden="true" className={styles.veil} />
        <svg
          ref={floorRef}
          aria-hidden="true"
          className={styles.floor}
          width="1"
          height="1"
        >
          <path ref={floorPathRef} />
        </svg>

        <ol aria-label="The walk, in eight stops" className={styles.stops}>
          {WALK.map((id, index) => {
            const sticker = BY_ID[id];
            const longest = Math.max(sticker.width, sticker.height);
            const isOpen = storyOpen && shownIndex === index;
            return (
              <li
                key={id}
                ref={registerStop}
                data-index={index}
                className={styles.stop}
                data-current={index === current ? "" : undefined}
                style={
                  {
                    "--aw": sticker.width / longest,
                    "--ah": sticker.height / longest,
                  } as CSSProperties
                }
              >
                <div className={styles.stopInner}>
                  <span aria-hidden="true" className={styles.pool} />
                  <button
                    ref={registerButton}
                    type="button"
                    data-index={index}
                    className={styles.stopButton}
                    aria-label={`${sticker.label}, stop ${index + 1} of ${WALK.length}`}
                    aria-expanded={isOpen}
                    aria-controls={storyId}
                    onClick={onStopClick}
                    onFocus={onStopFocus}
                  >
                    <ViewTransition
                      name={stickerTransitionName(sticker.id)}
                      share="sticker-morph"
                      default="none"
                    >
                      <span
                        data-sticker-art={sticker.id}
                        className={styles.art}
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
                            sizes={HI_RES_SIZES}
                            draggable={false}
                            className={cn(
                              styles.hiRes,
                              "size-full object-contain",
                            )}
                            onLoad={markLoaded}
                          />
                        ) : null}
                      </span>
                    </ViewTransition>
                  </button>
                  <span aria-hidden="true" className={styles.marker}>
                    {MILESTONES[id]}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        <svg
          ref={inkRef}
          aria-hidden="true"
          className={styles.ink}
          viewBox={`0 0 ${WORD_BOX.width} ${WORD_BOX.height}`}
        >
          <path className={styles.inkStroke} d={WORD_PATH} pathLength={1} />
          <path className={styles.inkHead} d={WORD_PATH} pathLength={1} />
          {WORD_DOTS.map((d, index) => (
            <path
              key={d}
              className={styles.inkDot}
              d={d}
              style={
                {
                  "--dot": index,
                } as CSSProperties
              }
            />
          ))}
        </svg>

        <header
          className={cn(
            styles.chrome,
            "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5 sm:p-8",
          )}
          data-no-drag
        >
          <div>
            <h2 className="list-heading text-[2rem] text-foreground">Desk</h2>
            <p className="mt-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              {atEnd
                ? "The end of the walk"
                : `${stopNumber(current)} · ${MILESTONES[WALK[current]]}`}
            </p>
            <p className="mt-1 font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground/75">
              {reduced ? (
                "← → or the arrows below to step"
              ) : (
                <>
                  <span className="[@media(pointer:coarse)]:hidden">
                    Scroll or drag to walk · click a sticker to read
                  </span>
                  <span className="hidden [@media(pointer:coarse)]:inline">
                    Swipe to walk · tap a sticker to read
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close the sticker desk"
            className={roundButton}
            onClick={close}
          >
            <RiCloseLine aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className={styles.storyRegion} data-no-drag>
          {reduced && atEnd ? (
            <div className={cn(styles.panel, "text-center")}>{codaContent}</div>
          ) : (
            <section
              ref={storyRef}
              id={storyId}
              aria-label={`${shown.label}: the story`}
              aria-hidden={!storyOpen}
              inert={!storyOpen}
              // biome-ignore lint/a11y/noNoninteractiveTabindex: long stories scroll, so keyboard users need a stop to scroll them.
              tabIndex={0}
              className={cn(styles.panel, styles.story)}
              data-open={storyOpen ? "" : undefined}
            >
              <p className="font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
                {stopNumber(shownIndex)} · {MILESTONES[shownId]}
              </p>
              <h3 className="list-heading mt-3 text-[2.15rem] leading-none text-foreground">
                {shown.label}
              </h3>
              <p className="mt-4 text-[15px] leading-7 text-pretty whitespace-pre-line text-foreground/90 select-text">
                {shown.story}
              </p>
            </section>
          )}
          {reduced ? (
            <div className="pointer-events-auto mt-3 flex items-center gap-2">
              <button
                type="button"
                className={pillButton}
                onClick={onPrevious}
                disabled={current === 0}
              >
                <RiArrowLeftLine aria-hidden="true" className="size-4" />
                Back
              </button>
              <button
                type="button"
                className={pillButton}
                onClick={onNext}
                disabled={atEnd}
              >
                {current === CODA - 1 ? "The end" : "Walk on"}
                <RiArrowRightLine aria-hidden="true" className="size-4" />
              </button>
            </div>
          ) : null}
        </div>

        {reduced ? null : (
          <div className={styles.coda} data-no-drag>
            {codaContent}
          </div>
        )}
      </div>

      {reduced ? null : (
        <>
          <div aria-hidden="true" className={styles.runway} />
          {Array.from(
            {
              length: CODA + 1,
            },
            (_, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: one snap point per step, fixed.
                key={index}
                aria-hidden="true"
                className={styles.snap}
                style={
                  {
                    "--i": index,
                  } as CSSProperties
                }
              />
            ),
          )}
        </>
      )}
    </div>
  );
}
