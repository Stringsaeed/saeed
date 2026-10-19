"use client";

import Image from "next/image";
import {
  type CSSProperties,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { flushSync } from "react-dom";
import {
  chooseDeskVariant,
  type DeskVariant,
  endDeskSession,
  peekDeskVariant,
  startDeskSession,
} from "@/lib/desk-experiment";
import { playSound } from "@/lib/sound";
import { STICKERS, stickerTransitionName } from "./sticker-data";
import { StickerPaperweights } from "./sticker-paperweights";
import {
  closeDeskWithTransition,
  STICKER_ART_SIZES,
} from "./sticker-transition";

const PILE_SIZE = 112;
// Hand-placed scatter so the pile reads as tossed, not stacked in a column.
const SCATTER = [
  {
    x: 0,
    y: 0,
    rotate: -6,
    fanX: -18,
    fanY: -30,
    fanRotate: -10,
  },
  {
    x: 12,
    y: -6,
    rotate: 9,
    fanX: 4,
    fanY: -52,
    fanRotate: 12,
  },
  {
    x: -12,
    y: 4,
    rotate: -14,
    fanX: -46,
    fanY: -12,
    fanRotate: -22,
  },
  {
    x: 8,
    y: 10,
    rotate: 4,
    fanX: -4,
    fanY: -6,
    fanRotate: 6,
  },
  {
    x: -6,
    y: -10,
    rotate: 12,
    fanX: -30,
    fanY: -56,
    fanRotate: 16,
  },
  {
    x: 12,
    y: 8,
    rotate: -9,
    fanX: 6,
    fanY: -24,
    fanRotate: -4,
  },
  {
    x: -14,
    y: -4,
    rotate: 6,
    fanX: -54,
    fanY: -40,
    fanRotate: 10,
  },
  {
    x: 4,
    y: 12,
    rotate: -3,
    fanX: -26,
    fanY: 4,
    fanRotate: -8,
  },
];

type LongTakeDesk = typeof import("./sticker-long-take").StickerLongTake;

// Long Take is the experiment's challenger, so only its visitors load it.
let LongTake: LongTakeDesk | undefined;
function loadLongTake() {
  return import("./sticker-long-take").then((module) => {
    LongTake = module.StickerLongTake;
  });
}

function loadDesk(variant: DeskVariant) {
  return variant === "long-take" ? loadLongTake() : Promise.resolve();
}

// The corner pile and the desk it opens, as a plain modal on whatever page
// is showing: no route of its own. Which desk opens is the `sticker-desk`
// experiment. Opening runs inside a transition so React morphs each sticker
// from the pile into the desk; closing flies them back.
export function StickerPile() {
  const [desk, setDesk] = useState<DeskVariant | null>(null);
  const open = desk !== null;
  const deskRef = useRef<HTMLDivElement>(null);
  const pileRef = useRef<HTMLButtonElement>(null);
  const reopenFocus = useRef(false);
  const opening = useRef(false);

  // Reaching for the pile warms up the desk it will open.
  const preloadDesk = useCallback(() => {
    void peekDeskVariant().then(loadDesk);
  }, []);

  const openDesk = useCallback(async () => {
    if (opening.current) return;
    opening.current = true;
    try {
      const variant = await chooseDeskVariant();
      await loadDesk(variant).catch(() => undefined);
      const shown =
        variant === "long-take" && !LongTake ? "paperweights" : variant;
      startDeskSession(shown);
      startTransition(() => setDesk(shown));
    } finally {
      opening.current = false;
    }
  }, []);

  const closeDesk = useCallback(() => {
    playSound("deskClose");
    endDeskSession();
    reopenFocus.current = true;
    const element = deskRef.current;
    const done = () => flushSync(() => setDesk(null));
    if (element) closeDeskWithTransition(element, done);
    else done();
  }, []);

  // The desk moves focus into itself; it comes back to the pile on close.
  // The page behind stays put while the desk is up.
  useEffect(() => {
    if (!open) {
      if (reopenFocus.current) {
        reopenFocus.current = false;
        pileRef.current?.focus({
          preventScroll: true,
        });
      }
      return;
    }
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [
    open,
  ]);

  // The desk owns the shared transition names while it is open.
  if (open) {
    const Desk =
      desk === "long-take" && LongTake ? LongTake : StickerPaperweights;
    return (
      <div ref={deskRef} className="contents">
        <Desk onClose={closeDesk} />
      </div>
    );
  }

  return (
    <button
      ref={pileRef}
      type="button"
      onClick={openDesk}
      onPointerEnter={preloadDesk}
      onFocus={preloadDesk}
      aria-label="Open the sticker desk"
      aria-haspopup="dialog"
      className="group/pile fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 block size-(--pile-size) cursor-pointer scale-75 origin-bottom-right rounded-3xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:scale-[0.72] min-[960px]:scale-100 min-[960px]:active:scale-95 print:hidden forced-colors:hidden"
      style={
        {
          "--pile-size": `${PILE_SIZE}px`,
        } as CSSProperties
      }
      data-sticker-pile
      data-sound="deskOpen"
    >
      {STICKERS.map((sticker, index) => {
        const scatter = SCATTER[index % SCATTER.length];
        const fit = Math.min(
          (PILE_SIZE * 0.82) / sticker.width,
          (PILE_SIZE * 0.82) / sticker.height,
        );
        const width = Math.round(sticker.width * fit);
        const height = Math.round(sticker.height * fit);

        return (
          <span
            key={sticker.id}
            className="absolute top-1/2 left-1/2 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/pile:translate-x-(--fan-x) group-hover/pile:translate-y-(--fan-y) group-focus-visible/pile:translate-x-(--fan-x) group-focus-visible/pile:translate-y-(--fan-y) group-hover/pile:rotate-(--fan-rotate) group-focus-visible/pile:rotate-(--fan-rotate)"
            style={
              {
                zIndex: STICKERS.length - index,
                marginLeft: -width / 2 + scatter.x,
                marginTop: -height / 2 + scatter.y,
                "--fan-x": `${scatter.fanX}px`,
                "--fan-y": `${scatter.fanY}px`,
                "--fan-rotate": `${scatter.fanRotate - scatter.rotate}deg`,
              } as CSSProperties
            }
          >
            <ViewTransition
              name={stickerTransitionName(sticker.id)}
              share="sticker-morph"
              default="none"
            >
              <span
                data-sticker-art={sticker.id}
                className="block drop-shadow-lg"
                style={{
                  width,
                  height,
                  rotate: `${scatter.rotate}deg`,
                }}
              >
                <Image
                  src={sticker.src}
                  alt=""
                  width={width}
                  height={height}
                  sizes={STICKER_ART_SIZES}
                  loading="eager"
                  className="size-full object-contain"
                  draggable={false}
                />
              </span>
            </ViewTransition>
          </span>
        );
      })}
    </button>
  );
}
