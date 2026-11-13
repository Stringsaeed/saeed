"use client";

import {
  Fragment,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ProjectLinkType } from "@/data/projects";
import { onIdle } from "@/lib/idle";
import { playHoverSound, playSound } from "@/lib/sound";
import type { CartridgeStage } from "./cartridge-stage";
import { CARTRIDGES, type Cartridge, MAX_STICKERS } from "./cartridges";
import styles from "./shelf.module.css";

// The apps as cartridges. The grid is ordinary buttons, one per app, so it
// reads, tabs and wraps like any list; a single canvas draws a 3D cartridge
// over each. Hover one and it turns to face the pointer, drag it sideways
// to spin it, click it to pull it out and read what it is.

const LINK_LABELS: Record<ProjectLinkType, string> = {
  "app-store": "App Store",
  "play-store": "Google Play",
  github: "GitHub",
  web: "Web",
  press: "Press",
  linkedin: "LinkedIn",
  testflight: "TestFlight",
};

const BY_ID = new Map(
  CARTRIDGES.map((cartridge) => [
    cartridge.id,
    cartridge,
  ]),
);

/** How far a press may travel and still be a click, in CSS pixels. */
const CLICK_SLOP = 6;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function Links({ cartridge }: { cartridge: Cartridge }) {
  return (
    <span className={styles.links}>
      {cartridge.links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={link.ariaLabel}
          data-sound="tap"
          data-analytics-event="Project Link Clicked"
          data-analytics-project={cartridge.name}
          data-analytics-location="Home"
        >
          {LINK_LABELS[link.type]}
          {link.platform ? ` ${link.platform}` : ""}
        </a>
      ))}
    </span>
  );
}

export function ProjectsShelf() {
  const reduced = usePrefersReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<CartridgeStage | null>(null);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // three.js is fetched when the shelf is nearly in view, not before.
  useEffect(() => {
    const grid = gridRef.current;
    const canvas = canvasRef.current;
    if (!grid || !canvas) return;
    let cancelled = false;
    let stage: CartridgeStage | null = null;
    let cancelIdle: (() => void) | undefined;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        near.disconnect();
        // Building sixteen cartridges is real work, so it waits its turn
        // behind the first paint.
        cancelIdle = onIdle(() =>
          import("./cartridge-stage")
            .then(({ createCartridgeStage }) => {
              if (cancelled) return;
              const slots = new Map<string, HTMLElement>();
              for (const slot of grid.querySelectorAll<HTMLElement>(
                "[data-slot]",
              )) {
                slots.set(slot.dataset.slot ?? "", slot);
              }
              const links = new Map<string, HTMLElement[]>();
              for (const link of grid.querySelectorAll<HTMLElement>(
                "[data-sticker]",
              )) {
                const id = link.dataset.cartridge ?? "";
                const list = links.get(id) ?? [];
                list[Number(link.dataset.sticker)] = link;
                links.set(id, list);
              }
              stage = createCartridgeStage(canvas, slots, CARTRIDGES, {
                reducedMotion: reduced,
                onReady: () => setReady(true),
                links,
              });
              stageRef.current = stage;
            })
            .catch(() => {
              // Without WebGL the flat icons stay, and everything still works.
            }),
        );
      },
      {
        rootMargin: "600px 0px",
      },
    );
    near.observe(grid);
    return () => {
      cancelled = true;
      near.disconnect();
      cancelIdle?.();
      stageRef.current = null;
      stage?.dispose();
      setReady(false);
    };
  }, [
    reduced,
  ]);

  // What the stage shows as picked out follows what React has selected.
  useEffect(() => {
    if (ready) stageRef.current?.select(selected);
  }, [
    selected,
    ready,
  ]);

  const press = useRef<{
    pointer: number;
    id: string;
    x: number;
    y: number;
    dragged: boolean;
  } | null>(null);
  /** When the last drag ended, so the click that ends it is not also a
   *  selection. A time, not a flag: a finger's drag is followed by no click
   *  at all, and a flag would then swallow the next real tap. */
  const draggedAt = useRef(Number.NEGATIVE_INFINITY);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const stage = stageRef.current;
    const id = event.currentTarget.dataset.cartridge;
    if (!stage || !id) return;
    const held = press.current;
    if (held && held.pointer === event.pointerId) {
      const dx = event.clientX - held.x;
      if (
        !held.dragged &&
        Math.abs(dx) > CLICK_SLOP &&
        Math.abs(dx) > Math.abs(event.clientY - held.y)
      ) {
        held.dragged = true;
      }
      if (held.dragged) stage.turn(id, dx);
    }
    // The button holds its own slot; a sticker finds its cartridge's.
    const slot = gridRef.current?.querySelector(`[data-slot="${id}"]`);
    if (!slot) return;
    const rect = slot.getBoundingClientRect();
    stage.point(
      id,
      Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
      ),
      Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
      ),
    );
  }, []);

  const onPointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "mouse") return;
      setHovered(event.currentTarget.dataset.cartridge ?? null);
      playHoverSound("hover");
    },
    [],
  );

  const onPointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const id = event.currentTarget.dataset.cartridge;
      if (!id) return;
      // Onto one of its own stickers is not off the cartridge.
      const into = event.relatedTarget;
      if (into instanceof HTMLElement && into.dataset.cartridge === id) return;
      setHovered((current) => (current === id ? null : current));
      if (press.current?.id !== id) stageRef.current?.leave(id);
    },
    [],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const id = event.currentTarget.dataset.cartridge;
      if (!id || event.button !== 0) return;
      press.current = {
        pointer: event.pointerId,
        id,
        x: event.clientX,
        y: event.clientY,
        dragged: false,
      };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Fine without capture; the drag just ends at the button's edge.
      }
      stageRef.current?.press(id, true);
    },
    [],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const held = press.current;
      if (!held || held.pointer !== event.pointerId) return;
      press.current = null;
      const stage = stageRef.current;
      stage?.press(held.id, false);
      if (held.dragged) {
        stage?.drop(held.id);
        draggedAt.current = performance.now();
      }
      // A finger does not hover, so it also lets go of the tilt.
      if (event.pointerType !== "mouse" || event.type === "pointercancel") {
        stage?.leave(held.id);
      }
    },
    [],
  );

  const onClick = useCallback((event: { currentTarget: HTMLElement }) => {
    if (performance.now() - draggedAt.current < 120) return;
    const id = event.currentTarget.dataset.cartridge ?? null;
    setSelected((current) => (current === id ? null : id));
    playSound("select");
  }, []);

  const onFocus = useCallback((event: { currentTarget: HTMLElement }) => {
    const id = event.currentTarget.dataset.cartridge;
    if (!id) return;
    setHovered(id);
    // Focus with the keyboard brings it round to face front.
    if (event.currentTarget.matches(":focus-visible")) {
      stageRef.current?.point(id, 0, 0);
    }
  }, []);

  const onBlur = useCallback((event: { currentTarget: HTMLElement }) => {
    const id = event.currentTarget.dataset.cartridge;
    if (!id) return;
    setHovered((current) => (current === id ? null : current));
    stageRef.current?.leave(id);
  }, []);

  // A sticker lies on top of its cartridge, so the pointer on a sticker is
  // still on the cartridge: it keeps facing the pointer, and the sticker
  // lifts.
  const onStickerEnter = useCallback(
    (event: ReactPointerEvent<HTMLAnchorElement>) => {
      const { cartridge, sticker } = event.currentTarget.dataset;
      if (!cartridge) return;
      stageRef.current?.stick(cartridge, Number(sticker));
      if (event.pointerType === "mouse") setHovered(cartridge);
    },
    [],
  );

  const onStickerLeave = useCallback(
    (event: ReactPointerEvent<HTMLAnchorElement>) => {
      const { cartridge } = event.currentTarget.dataset;
      if (!cartridge) return;
      const stage = stageRef.current;
      stage?.stick(cartridge, null);
      // Back onto the cartridge keeps it; off it altogether lets it go.
      const into = event.relatedTarget;
      const stays =
        into instanceof HTMLElement && into.dataset.cartridge === cartridge;
      if (!stays) {
        stage?.leave(cartridge);
        setHovered((current) => (current === cartridge ? null : current));
      }
    },
    [],
  );

  const onStickerFocus = useCallback(
    (event: { currentTarget: HTMLElement }) => {
      const { cartridge, sticker } = event.currentTarget.dataset;
      if (!cartridge) return;
      setHovered(cartridge);
      stageRef.current?.point(cartridge, 0, 0);
      stageRef.current?.stick(cartridge, Number(sticker));
    },
    [],
  );

  const onStickerBlur = useCallback((event: { currentTarget: HTMLElement }) => {
    const { cartridge } = event.currentTarget.dataset;
    if (!cartridge) return;
    setHovered((current) => (current === cartridge ? null : current));
    stageRef.current?.stick(cartridge, null);
    stageRef.current?.leave(cartridge);
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") setSelected(null);
  }, []);

  const shown = BY_ID.get(selected ?? hovered ?? "");

  return (
    <section
      className={styles.shelf}
      aria-label="Apps and side projects"
      data-ready={ready || undefined}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Escape puts the picked cartridge back from any button in the grid. */}
      <div className={styles.grid} ref={gridRef} onKeyDown={onKeyDown}>
        <canvas ref={canvasRef} className={styles.canvas} />
        {CARTRIDGES.map((cartridge) => (
          <Fragment key={cartridge.id}>
            <button
              type="button"
              className={styles.cell}
              data-cartridge={cartridge.id}
              data-selected={selected === cartridge.id || undefined}
              aria-pressed={selected === cartridge.id}
              aria-label={`${cartridge.name}. ${cartridge.description}`}
              onPointerEnter={onPointerEnter}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={onClick}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              <span className={styles.slot} data-slot={cartridge.id}>
                {/* The flat icon holds the place until the cartridge is drawn,
                  and stays if it never is. */}
                {/* biome-ignore lint/performance/noImgElement: a 56px placeholder that the canvas replaces; next/image would add a request per icon for nothing. */}
                <img
                  className={styles.flat}
                  src={cartridge.logo}
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className={styles.name}>{cartridge.name}</span>
            </button>
            {/* A link over each sticker on the cartridge. The sticker is
              drawn in the canvas; the stage keeps the link on top of it. */}
            {cartridge.links.slice(0, MAX_STICKERS).map((link, index) => (
              <a
                key={link.href}
                className={styles.sticker}
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={link.ariaLabel}
                title={`${LINK_LABELS[link.type]}${link.platform ? ` ${link.platform}` : ""}`}
                data-cartridge={cartridge.id}
                draggable={false}
                data-sticker={index}
                data-sound="tap"
                data-analytics-event="Project Link Clicked"
                data-analytics-project={cartridge.name}
                data-analytics-location="Home"
                onPointerEnter={onStickerEnter}
                onPointerMove={onPointerMove}
                onPointerLeave={onStickerLeave}
                onFocus={onStickerFocus}
                onBlur={onStickerBlur}
              >
                <span className={styles.srOnly}>{link.ariaLabel}</span>
              </a>
            ))}
          </Fragment>
        ))}
      </div>
      <div
        className={styles.detail}
        aria-live="polite"
        data-open={shown ? "" : undefined}
        data-pinned={selected ? "" : undefined}
      >
        {shown ? (
          <>
            <p className={styles.title}>
              <strong>{shown.name}</strong>
              <span>
                {shown.kind === "shipped" ? "Shipped" : "Side project"}
              </span>
            </p>
            <p className={styles.description}>{shown.description}</p>
            <Links cartridge={shown} />
          </>
        ) : (
          <p className={styles.hint}>
            Apps I shipped, then side projects. Drag one to spin it, press it to
            pull it out, or press a sticker to go there.
          </p>
        )}
      </div>
    </section>
  );
}
