"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  type ChangeEvent,
  type MouseEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { STICKERS, type StickerDefinition } from "@/components/sticker-data";
import { playSound } from "@/lib/sound";
import {
  COMPOSITIONS,
  compositionKey,
  DEFAULT_PORTRAIT,
  GROUPS,
  LANES,
  type Lane,
  type Portrait,
  parsePortrait,
} from "./compositions";
import styles from "./portrait.module.css";

// biome-ignore lint/style/useComponentExportOnlyModules: prototype harness metadata.
export const kind = "inline";
// biome-ignore lint/style/useComponentExportOnlyModules: prototype harness metadata.
export const pickerPosition = "bottom";

const STORAGE_KEY = "sticker-portrait";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readReducedMotion() {
  return window.matchMedia(REDUCED_MOTION).matches;
}
function serverReducedMotion() {
  return true;
}

const OBJECT_VARIANTS = {
  exit: (animate: boolean) => ({
    opacity: 0,
    transition: {
      duration: animate ? 0.12 : 0,
    },
  }),
};
const EASE = [
  0.22,
  1,
  0.36,
  1,
] satisfies [
  number,
  number,
  number,
  number,
];

function stickerFor(id: StickerDefinition["id"]) {
  const sticker = STICKERS.find((item) => item.id === id);
  if (!sticker) throw new Error(`Missing portrait sticker: ${id}`);
  return sticker;
}

function Story({ sticker }: { sticker: StickerDefinition }) {
  return (
    <div className={styles.story}>
      {sticker.story.split("\n\n").map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

function StoryFigure({ sticker }: { sticker: StickerDefinition }) {
  return (
    <figure className={styles.storyFigure}>
      <Image
        src={sticker.src}
        alt={sticker.label}
        width={sticker.width}
        height={sticker.height}
        sizes="(max-width: 380px) 80vw, 300px"
      />
    </figure>
  );
}

export default function PortraitComposer() {
  const [portrait, setPortrait] = useState(DEFAULT_PORTRAIT);
  const [hasChosen, setHasChosen] = useState(false);
  const [inspected, setInspected] = useState<StickerDefinition["id"] | null>(
    null,
  );
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readReducedMotion,
    serverReducedMotion,
  );
  const originRef = useRef<HTMLButtonElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const layout = COMPOSITIONS[compositionKey(portrait)];
  const story = inspected ? stickerFor(inspected) : null;

  useEffect(() => {
    try {
      // Restoration is deliberately silent and never uses the selection entrance.
      setPortrait(parsePortrait(localStorage.getItem(STORAGE_KEY)));
    } catch {
      // Storage is optional; the composer also works in restricted browsers.
    }
  }, []);

  function revealStory(stickerId: StickerDefinition["id"]) {
    setInspected(stickerId);
    requestAnimationFrame(() => {
      headingRef.current?.focus({
        preventScroll: true,
      });
      headingRef.current?.closest("section")?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    });
  }

  function commit(next: Portrait) {
    if (compositionKey(next) === compositionKey(portrait)) return;
    setHasChosen(true);
    setPortrait(next);
    playSound("stickerPlace");
    try {
      localStorage.setItem(STORAGE_KEY, compositionKey(next));
    } catch {
      // A blocked write must not prevent choosing a portrait.
    }
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    commit(parsePortrait(event.currentTarget.value));
  }

  function readStory(event: MouseEvent<HTMLButtonElement>) {
    const selected = STICKERS.find(
      (item) => item.id === event.currentTarget.value,
    );
    if (!selected) return;
    originRef.current = event.currentTarget;
    revealStory(selected.id);
  }

  function closeStory() {
    setInspected(null);
    requestAnimationFrame(() => originRef.current?.focus());
  }

  function resetPortrait() {
    commit(DEFAULT_PORTRAIT);
  }

  function nextStory() {
    const next =
      STICKERS[
        (STICKERS.findIndex((item) => item.id === inspected) + 1) %
          STICKERS.length
      ];
    revealStory(next.id);
  }

  function group<L extends Lane>(lane: L) {
    const selected = stickerFor(portrait[lane]);
    return (
      <fieldset className={styles.group} key={lane}>
        <legend>{GROUPS[lane].label}</legend>
        <div className={styles.choices}>
          {GROUPS[lane].options.map((option) => {
            return (
              <label className={styles.choice} key={option.id}>
                <input
                  type="radio"
                  name={`${id}-${lane}`}
                  value={compositionKey({
                    ...portrait,
                    [lane]: option.id,
                  })}
                  checked={portrait[lane] === option.id}
                  onChange={choose}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
        <button
          type="button"
          className={styles.readButton}
          aria-controls={`${id}-inspection`}
          aria-expanded={inspected === selected.id}
          value={selected.id}
          onClick={readStory}
        >
          Read about {selected.label} <span aria-hidden="true">↗</span>
        </button>
      </fieldset>
    );
  }

  return (
    <section className={styles.portrait} aria-labelledby={`${id}-title`}>
      <header className={styles.header}>
        <h2 id={`${id}-title`}>A small portrait of me.</h2>
        <p>A place, a rhythm, something I keep close.</p>
      </header>
      <div className={styles.composer}>
        <figure
          className={styles.composition}
          aria-label={`A portrait with ${LANES.map((lane) => stickerFor(portrait[lane]).label).join(", ")}`}
        >
          {LANES.map((lane) => {
            const sticker = stickerFor(portrait[lane]);
            const placement = layout[lane];
            return (
              <div
                className={styles.lane}
                key={lane}
                style={{
                  zIndex: placement.z,
                }}
              >
                <AnimatePresence
                  initial={false}
                  custom={hasChosen && !reducedMotion}
                >
                  <motion.div
                    key={sticker.id}
                    className={styles.object}
                    data-portrait-object={sticker.id}
                    style={{
                      left: `${placement.x / 3.6}%`,
                      top: `${placement.y / 3}%`,
                      width: `${placement.width / 3.6}%`,
                      rotate: placement.rotation,
                    }}
                    initial={
                      hasChosen && !reducedMotion
                        ? {
                            opacity: 0,
                            y: 16,
                          }
                        : false
                    }
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    variants={OBJECT_VARIANTS}
                    exit="exit"
                    transition={{
                      duration: reducedMotion || !hasChosen ? 0 : 0.28,
                      ease: EASE,
                      opacity: {
                        duration: reducedMotion || !hasChosen ? 0 : 0.12,
                      },
                    }}
                  >
                    <Image
                      src={sticker.src}
                      alt=""
                      width={sticker.width}
                      height={sticker.height}
                      sizes={`${placement.width}px`}
                      loading="eager"
                      draggable={false}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            );
          })}
        </figure>
        <div className={styles.controls}>
          {group("place")}
          {group("rhythm")}
          {group("keepsake")}
        </div>
      </div>
      <div className={styles.caption}>
        <span>Three objects. One of many ways to know me.</span>
        <button type="button" onClick={resetPortrait}>
          Reset portrait
        </button>
      </div>
      <div id={`${id}-inspection`}>
        {story !== null && (
          <section
            className={styles.inspection}
            aria-labelledby={`${id}-story-title`}
          >
            <div className={styles.readingBar}>
              <span>A closer look</span>
              <button type="button" onClick={closeStory}>
                See this portrait <span aria-hidden="true">↑</span>
              </button>
            </div>
            <StoryFigure sticker={story} />
            <h3 id={`${id}-story-title`} ref={headingRef} tabIndex={-1}>
              {story.label}
            </h3>
            <Story sticker={story} />
            <div className={styles.storyFooter}>
              <button type="button" onClick={closeStory}>
                Back to my portrait
              </button>
              <button type="button" onClick={nextStory}>
                Next story <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}
      </div>
      <details className={styles.allStories}>
        <summary>
          Read all eight stories <span aria-hidden="true">+</span>
        </summary>
        <div className={styles.archive}>
          {STICKERS.map((sticker, index) => (
            <article
              key={sticker.id}
              aria-labelledby={`${id}-all-${sticker.id}`}
            >
              <div className={styles.archiveNumber}>
                {String(index + 1).padStart(2, "0")} / 08
              </div>
              <StoryFigure sticker={sticker} />
              <h3 id={`${id}-all-${sticker.id}`}>{sticker.label}</h3>
              <Story sticker={sticker} />
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
