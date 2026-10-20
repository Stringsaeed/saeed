"use client";

import {
  createContext,
  type RefObject,
  useContext,
  useEffect,
  useState,
} from "react";

export const NEAR_VIEWPORT_MARGIN = 800;

export type FigureContextValue = {
  /** True when the reader asked for reduced motion: show end states, skip
   *  tweens, and don't autoplay. */
  reducedMotion: boolean;
};

export const FigureContext = createContext<FigureContextValue>({
  reducedMotion: false,
});

/** Read inside a figure's children to honour reduced motion. */
export function useFigure() {
  return useContext(FigureContext);
}

/** True once `ref` comes within `margin` px of the viewport; never resets. */
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
