"use client";

import {
  type MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import "./picker.css";

export type PickerItem = {
  name: string;
  title?: string;
};

// Picker behaviour from emilkowalski/prototype PICKER.md, expressed in React:
// 1–N and ←/→ switch, R replays, ?v= persists, switching re-mounts instantly.
export function Picker({
  items,
  current,
  position,
  onSelect,
  onReplay,
}: {
  items: PickerItem[];
  current: number;
  position: "top" | "bottom";
  onSelect: (index: number) => void;
  /** Omit when nothing animates: the replay button and divider then hide. */
  onReplay?: () => void;
}) {
  const pickerRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const registerItem = useCallback((node: HTMLButtonElement | null) => {
    if (node) itemRefs.current[Number(node.dataset.index)] = node;
  }, []);

  const onItemClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      onSelect(Number(event.currentTarget.dataset.index)),
    [
      onSelect,
    ],
  );

  useLayoutEffect(() => {
    const move = () => {
      const item = itemRefs.current[current];
      const highlight = highlightRef.current;
      if (!item || !highlight) return;
      highlight.style.width = `${item.offsetWidth}px`;
      highlight.style.transform = `translateX(${item.offsetLeft}px)`;
    };
    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
  }, [
    current,
  ]);

  // Enable the slide only after first paint, so load doesn't animate.
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        pickerRef.current?.setAttribute("data-ready", ""),
      ),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <nav
      ref={pickerRef}
      className="proto-picker"
      aria-label="Prototype variants"
      data-position={position === "top" ? "top" : undefined}
    >
      <span
        ref={highlightRef}
        className="proto-picker-highlight"
        aria-hidden="true"
      />
      {items.map((variant, index) => (
        <button
          key={variant.name}
          ref={registerItem}
          data-index={index}
          type="button"
          className="proto-picker-item"
          data-active={index === current ? "" : undefined}
          aria-current={index === current ? "true" : undefined}
          title={variant.title}
          onClick={onItemClick}
        >
          {variant.name}
        </button>
      ))}
      {onReplay ? (
        <>
          <span className="proto-picker-divider" aria-hidden="true" />
          <button
            type="button"
            className="proto-picker-item proto-picker-replay"
            aria-label="Replay animation (R)"
            onClick={onReplay}
          >
            ↻
          </button>
        </>
      ) : null}
    </nav>
  );
}
