"use client";

import {
  createContext,
  type RefObject,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
} from "react";

export const NEAR_VIEWPORT_MARGIN = 800;

export type FigureContextValue = {
  /** The reader asked for reduced motion: show end states, skip tweens. */
  reducedMotion: boolean;
  /** The reader's play/pause choice. Starts paused under reduced motion. */
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  /** Playing, on screen, and the tab is visible. Loops run only while true. */
  active: boolean;
  /** The reader has used play/pause on this figure at least once. */
  userChose: boolean;
};

export const FigureContext = createContext<FigureContextValue>({
  reducedMotion: false,
  playing: true,
  setPlaying: () => {},
  active: true,
  userChose: false,
});

/** Read inside a figure to honour reduced motion and pausing. */
export function useFigure() {
  return useContext(FigureContext);
}

/** Layout a hosted figure must match: the post reserves it before the
 *  figure's code loads (see registry.ts). */
export type FigureLayout = {
  /** Whether the figure renders a title/controls row. */
  header: boolean;
} & (
  | {
      /** CSS aspect-ratio of the stage, e.g. "16 / 9". For figures that
       *  draw into a box (canvases). */
      aspect: string;
      minHeight?: never;
    }
  | {
      aspect?: never;
      /** For figures whose height follows their content: the mounted
       *  stage's height (px) at each width in MIN_HEIGHT_WIDTHS. The stage
       *  reserves it before the figure loads, interpolating between the
       *  two nearest widths (globals.css); the figure may grow past it. */
      minHeight: FigureMinHeight;
    }
);

/** Stage widths (px) a `minHeight` is given at: a post's figure is 272px
 *  wide on a 320px phone, 591px at the widest below `sm`, and 624–688px
 *  from `sm` up. Must match the bands in globals.css. */
export const MIN_HEIGHT_WIDTHS = [
  272,
  292,
  312,
  332,
  352,
  372,
  392,
  412,
  432,
  452,
  472,
  492,
  512,
  532,
  552,
  572,
  591,
  624,
  656,
  688,
] as const;

/** One height per entry of MIN_HEIGHT_WIDTHS, chosen so the linear
 *  interpolation between neighbours is never below the figure's real
 *  height (no shift on mount) and barely above it. */
export type FigureMinHeight = OnePer<typeof MIN_HEIGHT_WIDTHS>;

type OnePer<T extends readonly unknown[]> = {
  readonly [K in keyof T]: number;
};

export type FigureHost = FigureLayout & {
  name: string;
};

/** Set by InteractiveBlock: the server already rendered `<figure>` and the
 *  caption, so Figure renders only the surface, at the reserved size. */
export const FigureHostContext = createContext<FigureHost | null>(null);

export function useFigureHost() {
  return useContext(FigureHostContext);
}

/** True once `ref` comes within `margin` px of the viewport; never resets.
 *  Use it to decide when to mount, not whether to animate. */
export function useNearViewport(
  ref: RefObject<Element | null>,
  margin = NEAR_VIEWPORT_MARGIN,
) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (near || !element) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setNear(true);
      },
      {
        rootMargin: `${margin}px 0px`,
      },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [
    ref,
    margin,
    near,
  ]);

  return near;
}

/** True while `ref` is on screen and the tab is visible. Unlike
 *  useNearViewport it keeps observing, so it flips back on scroll-away. */
export function useOnScreen(ref: RefObject<Element | null>) {
  const [intersecting, setIntersecting] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setIntersecting(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setIntersecting(entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [
    ref,
  ]);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return intersecting && pageVisible;
}

export type FigureFrame = {
  /** Seconds since the previous frame, capped at 0.1 so a resume after a
   *  pause or a dropped frame never jumps the simulation. */
  dt: number;
  /** requestAnimationFrame timestamp, ms. */
  time: number;
};

/**
 * Runs `callback` every animation frame while the figure is active (playing,
 * on screen, tab visible) and stops when it isn't or on unmount. Figures use
 * this instead of calling requestAnimationFrame themselves, so every figure
 * pauses the same way.
 */
export function useFigureLoop(callback: (frame: FigureFrame) => void) {
  const { active } = useFigure();
  const onFrame = useEffectEvent(callback);

  useEffect(() => {
    if (!active) return;
    let id = 0;
    let last: number | undefined;
    const tick = (time: number) => {
      const dt = last === undefined ? 0 : Math.min((time - last) / 1000, 0.1);
      last = time;
      onFrame({
        dt,
        time,
      });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [
    active,
  ]);
}
