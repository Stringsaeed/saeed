"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type CSSProperties, ViewTransition } from "react";
import { STICKERS, stickerTransitionName } from "./sticker-data";
import { STICKER_ART_SIZES } from "./sticker-transition";

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

export function StickerPile() {
  const pathname = usePathname();
  // The desk owns the shared transition names while it is open.
  if (pathname === "/stickers") return null;

  return (
    <Link
      href="/stickers"
      aria-label="Open the sticker desk"
      className="group/pile fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 block size-(--pile-size) scale-75 origin-bottom-right rounded-3xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:scale-[0.72] min-[960px]:scale-100 min-[960px]:active:scale-95 print:hidden forced-colors:hidden"
      style={
        {
          "--pile-size": `${PILE_SIZE}px`,
        } as CSSProperties
      }
      data-sticker-pile
      data-analytics-event="Sticker Desk Opened"
      data-sound="tap"
      data-sound-hover="hover"
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
    </Link>
  );
}
