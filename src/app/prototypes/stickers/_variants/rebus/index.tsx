"use client";

import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import {
  STICKERS,
  type StickerDefinition,
  stickerTransitionName,
} from "@/components/sticker-data";
import { playHoverSound, playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { EYEBROW, type RebusSlot, SENTENCE, SLOTS } from "./copy";
import styles from "./rebus.module.css";

// biome-ignore lint/style/useComponentExportOnlyModules: read by the prototype registry.
export const kind = "inline";
// biome-ignore lint/style/useComponentExportOnlyModules: read by the prototype registry.
export const pickerPosition: "top" | "bottom" = "bottom";

type StickerId = StickerDefinition["id"];

const STORY_ID = "rebus-story";
const TOTAL = String(SLOTS.length).padStart(2, "0");
// One rendition for the slot and the lifted figure, so the morph reuses it.
const ART_SIZES = "240px";
const MORPH_MS = 520;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
// The lifted sticker fits in this box beside its story.
const FIGURE_LG = 200;
const FIGURE_SM = 128;

// Inline height (px, before the phone scale) and a tilt per sticker, hand
// set so the line reads as stickers pressed on at different moments. The
// Burj overshoots the line on purpose: it is tall, let it be tall.
const INLINE: Record<
  StickerId,
  {
    height: number;
    tilt: number;
  }
> = {
  pyramids: {
    height: 44,
    tilt: -3,
  },
  burj: {
    height: 74,
    tilt: 4,
  },
  bass: {
    height: 54,
    tilt: -5,
  },
  keyboard: {
    height: 42,
    tilt: 3,
  },
  controller: {
    height: 42,
    tilt: -4,
  },
  monstera: {
    height: 48,
    tilt: 5,
  },
  pencil: {
    height: 44,
    tilt: -6,
  },
  babylon: {
    height: 56,
    tilt: 2,
  },
};

// Landscape stickers have no room for text beside them on a narrow phone.
const WIDE = new Set<StickerId>([
  "pyramids",
  "keyboard",
  "controller",
]);

const BY_ID = new Map(
  STICKERS.map((sticker) => [
    sticker.id,
    sticker,
  ]),
);

function paragraphs(story: string) {
  return story.split(/\n\n+/);
}

function counter(index: number) {
  return `${String(index + 1).padStart(2, "0")} / ${TOTAL}`;
}

function fitBox(sticker: StickerDefinition, box: number) {
  const fit = Math.min(box / sticker.width, box / sticker.height);
  return {
    width: Math.round(sticker.width * fit),
    height: Math.round(sticker.height * fit),
  };
}

function slotStyle(sticker: StickerDefinition) {
  const { height, tilt } = INLINE[sticker.id];
  return {
    "--art-w": `${Math.round((sticker.width / sticker.height) * height)}px`,
    "--art-h": `${height}px`,
    "--tilt": `${tilt}deg`,
  } as CSSProperties;
}

function figureStyle(sticker: StickerDefinition, shaped: boolean) {
  const lg = fitBox(sticker, FIGURE_LG);
  const sm = fitBox(sticker, FIGURE_SM);
  return {
    "--fig-w-lg": `${lg.width}px`,
    "--fig-h-lg": `${lg.height}px`,
    "--fig-w-sm": `${sm.width}px`,
    "--fig-h-sm": `${sm.height}px`,
    // The raw PNG, not a next/image rendition: shape-outside reads its alpha.
    // Chrome treats a shape image that is still loading as no shape at all
    // and runs the text over the sticker, so the silhouette waits for it.
    "--shape": shaped ? `url(${sticker.src})` : "none",
  } as CSSProperties;
}

// The raw PNGs are big. Warm the one under the pointer so the silhouette is
// ready by the time the story opens.
const shapeLoads = new Map<StickerId, Promise<void>>();
function loadShape(sticker: StickerDefinition) {
  let load = shapeLoads.get(sticker.id);
  if (!load) {
    load = new Promise<void>((resolve) => {
      const image = new window.Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = sticker.src;
    });
    shapeLoads.set(sticker.id, load);
  }
  return load;
}

// The sticker art, named so React morphs it between the slot and the figure.
function Art({
  sticker,
  className,
}: {
  sticker: StickerDefinition;
  className: string;
}) {
  return (
    <ViewTransition
      name={stickerTransitionName(sticker.id)}
      share="sticker-morph"
      default="none"
    >
      <span data-sticker-art={sticker.id} className={className}>
        <Image
          src={sticker.src}
          alt=""
          width={sticker.width}
          height={sticker.height}
          sizes={ART_SIZES}
          loading="eager"
          draggable={false}
        />
      </span>
    </ViewTransition>
  );
}

function Word({ slot }: { slot: RebusSlot }) {
  if (!slot.wordArabic) return <>{slot.word}</>;
  return (
    <>
      <span lang="ar" dir="rtl" aria-hidden="true">
        {slot.wordArabic}
      </span>
      <span className="sr-only">{slot.word}</span>
    </>
  );
}

const footerLinkClassName =
  "inline-flex min-h-11 items-center gap-1.5 rounded-md font-mono text-[12px] tracking-[0.06em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default function Variant() {
  const reduceMotion = useReducedMotion() ?? false;
  const [openId, setOpenId] = useState<StickerId | null>(null);
  // The last story stays rendered while the block folds shut.
  const [shownId, setShownId] = useState<StickerId | null>(null);
  const [shapedIds, setShapedIds] = useState<ReadonlySet<StickerId>>(
    () => new Set(),
  );
  const openRef = useRef<StickerId | null>(null);
  const slotRefs = useRef(new Map<StickerId, HTMLButtonElement>());
  const blockRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const heightBefore = useRef<number | null>(null);
  const landTimer = useRef(0);

  const registerSlot = useCallback((node: HTMLButtonElement | null) => {
    if (!node) return;
    slotRefs.current.set(node.dataset.sticker as StickerId, node);
  }, []);

  // "stickerPlace" belongs to the moment the sticker lands back on its word,
  // which is the end of the morph, or right away when nothing morphs.
  const scheduleLand = useCallback(() => {
    window.clearTimeout(landTimer.current);
    const morphs =
      !reduceMotion && typeof document.startViewTransition === "function";
    landTimer.current = window.setTimeout(
      () => playSound("stickerPlace"),
      morphs ? MORPH_MS : 0,
    );
  }, [
    reduceMotion,
  ]);

  useEffect(() => () => window.clearTimeout(landTimer.current), []);

  const go = useCallback(
    (next: StickerId | null, focusSlot = false) => {
      const previous = openRef.current;
      if (next === previous) return;
      openRef.current = next;
      if (next) playSound("stickerLift");
      if (previous) scheduleLand();
      // Measured before React commits, so the block can ease between the two
      // story heights instead of jumping.
      heightBefore.current =
        previous && next ? (innerRef.current?.offsetHeight ?? null) : null;
      startTransition(() => {
        setOpenId(next);
        if (next) setShownId(next);
      });
      const focusTarget = next ?? previous;
      if ((focusSlot || next === null) && focusTarget) {
        slotRefs.current.get(focusTarget)?.focus({
          preventScroll: true,
        });
      }
    },
    [
      scheduleLand,
    ],
  );

  const fold = useCallback(
    () => go(null),
    [
      go,
    ],
  );

  const onSlotClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const id = event.currentTarget.dataset.sticker as StickerId;
      go(openRef.current === id ? null : id);
    },
    [
      go,
    ],
  );

  const step = useCallback(
    (direction: 1 | -1, focusSlot = false) => {
      const current = openRef.current;
      if (!current) return;
      const index = SLOTS.findIndex((slot) => slot.id === current);
      const next = SLOTS[index + direction];
      if (next) go(next.id, focusSlot);
    },
    [
      go,
    ],
  );

  // Keys are handled here, not at page level, so they only apply while focus
  // is inside the rebus. Anything handled is marked so the picker ignores it.
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!openRef.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        go(null);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1, true);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1, true);
      }
    },
    [
      go,
      step,
    ],
  );

  const onStepClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      step(event.currentTarget.dataset.step === "1" ? 1 : -1),
    [
      step,
    ],
  );

  const onSlotPointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse") playHoverSound("hover");
      const sticker = BY_ID.get(
        event.currentTarget.dataset.sticker as StickerId,
      );
      if (sticker) void loadShape(sticker);
    },
    [],
  );

  const onSlotFocus = useCallback((event: FocusEvent<HTMLButtonElement>) => {
    const sticker = BY_ID.get(event.currentTarget.dataset.sticker as StickerId);
    if (sticker) void loadShape(sticker);
  }, []);

  // The open story gets its silhouette once the PNG is in the cache.
  useEffect(() => {
    const sticker = openId ? BY_ID.get(openId) : undefined;
    if (!sticker || shapedIds.has(sticker.id)) return;
    let cancelled = false;
    void loadShape(sticker).then(() => {
      if (cancelled) return;
      setShapedIds((ids) => new Set(ids).add(sticker.id));
    });
    return () => {
      cancelled = true;
    };
  }, [
    openId,
    shapedIds,
  ]);

  // Moving between stories: ease the block from the old height to the new.
  useLayoutEffect(() => {
    const before = heightBefore.current;
    heightBefore.current = null;
    const block = blockRef.current;
    const inner = innerRef.current;
    if (before === null || !shownId || !block || !inner || reduceMotion) return;
    const after = inner.offsetHeight;
    if (after === before) return;
    const animation = block.animate(
      [
        {
          height: `${before}px`,
        },
        {
          height: `${after}px`,
        },
      ],
      {
        duration: 320,
        easing: EASE,
      },
    );
    return () => animation.cancel();
  }, [
    shownId,
    reduceMotion,
  ]);

  // Reduced motion: the global stylesheet zeroes every CSS transition, so the
  // one allowed fade runs through the animation API instead.
  useEffect(() => {
    if (!reduceMotion || !shownId || !openRef.current) return;
    innerRef.current?.animate(
      [
        {
          opacity: 0,
        },
        {
          opacity: 1,
        },
      ],
      {
        duration: 120,
        easing: "ease-out",
      },
    );
  }, [
    shownId,
    reduceMotion,
  ]);

  const shown = shownId ? BY_ID.get(shownId) : undefined;
  const shownIndex = shown
    ? SLOTS.findIndex((slot) => slot.id === shown.id)
    : -1;
  const previous = shownIndex > 0 ? BY_ID.get(SLOTS[shownIndex - 1].id) : null;
  const next =
    shownIndex >= 0 && shownIndex < SLOTS.length - 1
      ? BY_ID.get(SLOTS[shownIndex + 1].id)
      : null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: keys are only read while a descendant button has focus.
    <div
      className={cn(styles.root, "max-w-152")}
      data-open={openId ? "" : undefined}
      onKeyDown={onKeyDown}
    >
      <p className="backdrop-plate flex items-baseline gap-3">
        <span
          lang="ar"
          dir="rtl"
          className="text-sm font-medium text-foreground"
        >
          {EYEBROW.arabic}
        </span>
        <span className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
          {EYEBROW.gloss}
        </span>
      </p>

      <p
        className={cn(
          styles.sentence,
          "backdrop-plate mt-2 text-lg text-foreground",
        )}
      >
        {SENTENCE.map((token, index) => {
          if (typeof token === "string") {
            // biome-ignore lint/suspicious/noArrayIndexKey: the sentence is static.
            return <span key={index}>{token}</span>;
          }
          const sticker = BY_ID.get(token.id);
          if (!sticker) return null;
          const open = openId === token.id;
          return (
            <button
              key={token.id}
              ref={registerSlot}
              type="button"
              data-sticker={token.id}
              data-open={open ? "" : undefined}
              aria-expanded={open}
              aria-controls={STORY_ID}
              title={token.wordArabic ? token.word : undefined}
              className={cn(
                styles.slot,
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              )}
              style={slotStyle(sticker)}
              onClick={onSlotClick}
              onPointerEnter={onSlotPointerEnter}
              onFocus={onSlotFocus}
            >
              <span className={styles.ghost} aria-hidden="true" />
              <span className={styles.word}>
                <Word slot={token} />
              </span>
              {open ? null : <Art sticker={sticker} className={styles.art} />}
            </button>
          );
        })}
      </p>

      <section
        ref={blockRef}
        id={STORY_ID}
        aria-label={shown ? `The ${shown.label} story` : "Sticker story"}
        className={styles.block}
        data-open={openId ? "" : undefined}
        inert={!openId}
      >
        <div ref={innerRef} className={styles.inner}>
          {shown ? (
            <div className="backdrop-plate pt-6">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                  {counter(shownIndex)} · {shown.label}
                </p>
                <button
                  type="button"
                  className={footerLinkClassName}
                  onClick={fold}
                >
                  Fold
                  <span aria-hidden="true">×</span>
                </button>
              </div>

              <div key={shown.id} className={cn(styles.body, "mt-3")}>
                <div
                  className={styles.figure}
                  data-side={shownIndex % 2 ? "right" : "left"}
                  data-wide={WIDE.has(shown.id) ? "" : undefined}
                  style={figureStyle(shown, shapedIds.has(shown.id))}
                  aria-hidden="true"
                >
                  {openId === shown.id ? (
                    <Art sticker={shown} className={styles.figureArt} />
                  ) : null}
                </div>
                {paragraphs(shown.story).map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 32)}
                    className="max-w-152 text-base leading-7 text-pretty text-muted-foreground [&+p]:mt-4"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-4 flex clear-both items-center justify-between gap-4">
                {previous ? (
                  <button
                    type="button"
                    data-step="-1"
                    className={footerLinkClassName}
                    onClick={onStepClick}
                  >
                    <RiArrowLeftLine aria-hidden="true" className="size-3.5" />
                    {previous.label}
                  </button>
                ) : (
                  <span />
                )}
                {next ? (
                  <button
                    type="button"
                    data-step="1"
                    className={footerLinkClassName}
                    onClick={onStepClick}
                  >
                    {next.label}
                    <RiArrowRightLine aria-hidden="true" className="size-3.5" />
                  </button>
                ) : (
                  <span />
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
