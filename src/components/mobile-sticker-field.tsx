"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { onIdle } from "@/lib/idle";
import { cn } from "@/lib/utils";
import type { RaisedSticker } from "./mobile-sticker-story";
import { STICKERS, type StickerDefinition } from "./sticker-data";
import { playStickerSound } from "./sticker-sounds";

const loadStory = () => import("./mobile-sticker-story");

const MobileStickerStory = dynamic(
  () => loadStory().then((module) => module.MobileStickerStory),
  {
    ssr: false,
  },
);

const LAYOUT: Record<
  StickerDefinition["id"],
  {
    className: string;
    width: number;
  }
> = {
  keyboard: {
    className: "left-2 top-3 w-36 -rotate-8",
    width: 144,
  },
  monstera: {
    className: "right-2 top-1 w-28 rotate-6",
    width: 112,
  },
  bass: {
    className: "left-6 bottom-1 w-24 rotate-3",
    width: 96,
  },
  controller: {
    className: "right-3 bottom-3 w-36 -rotate-3",
    width: 144,
  },
  pencil: {
    className: "left-1/2 top-20 w-28 -translate-x-1/2 rotate-2",
    width: 112,
  },
  babylon: {
    className: "left-1/2 bottom-2 w-16 -translate-x-1/2 -rotate-3",
    width: 64,
  },
  pyramids: {
    className: "left-1/2 top-2 w-32 -translate-x-1/2 -rotate-2",
    width: 128,
  },
  burj: {
    className: "right-[30%] bottom-4 w-10 rotate-6",
    width: 40,
  },
};

export function MobileStickerField() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openId, setOpenId] = useState<StickerDefinition["id"] | null>(null);
  const [raisedSticker, setRaisedSticker] = useState<RaisedSticker | null>(
    null,
  );
  const openSticker = STICKERS.find((sticker) => sticker.id === openId);
  const [storyRequested, setStoryRequested] = useState(false);

  useEffect(
    () =>
      onIdle(() => {
        void loadStory();
        setStoryRequested(true);
      }),
    [],
  );

  const pressSticker = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    const id = event.currentTarget.dataset.stickerId;
    const sticker = STICKERS.find((candidate) => candidate.id === id);
    if (sticker) playStickerSound(sticker.id);
    setStoryRequested(true);
  }, []);

  const selectSticker = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const id = event.currentTarget.dataset.stickerId;
    const sticker = STICKERS.find((candidate) => candidate.id === id);
    if (!sticker) return;

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const renderedScale =
      Number.parseFloat(getComputedStyle(element).scale) || 1;
    setRaisedSticker({
      boundsHeight: rect.height / renderedScale,
      boundsWidth: rect.width / renderedScale,
      height: element.offsetHeight,
      originX: rect.left + rect.width / 2,
      originY: rect.top + rect.height / 2,
      rotate: getComputedStyle(element).rotate,
      targetCenterX: null,
      targetCenterY: null,
      targetScale: null,
      width: element.offsetWidth,
    });
    setOpenId(sticker.id);
    setDrawerOpen(true);
    setStoryRequested(true);
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setDrawerOpen(isOpen);
  }, []);

  const handleRaisedExitComplete = useCallback(() => {
    setOpenId(null);
    setRaisedSticker(null);
  }, []);

  return (
    <section aria-label="Sticker stories" className="mt-8 min-[960px]:hidden">
      <h2 className="list-heading">Desk</h2>
      <div className="relative mt-3 h-64 overflow-hidden rounded-3xl border border-border/60 bg-muted/40">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(var(--dot-color) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        />
        {STICKERS.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            onPointerDown={pressSticker}
            data-sticker-id={sticker.id}
            onClick={selectSticker}
            aria-label={`Open ${sticker.label.toLowerCase()} sticker story`}
            className={cn(
              "absolute drop-shadow-xl transition-[scale,filter] duration-300 ease-out active:scale-95",
              LAYOUT[sticker.id].className,
              openId === sticker.id &&
                typeof raisedSticker?.targetScale === "number" &&
                "opacity-0",
            )}
          >
            <Image
              src={sticker.src}
              alt=""
              width={LAYOUT[sticker.id].width}
              height={Math.round(
                (LAYOUT[sticker.id].width * sticker.height) / sticker.width,
              )}
              // A width-based srcset lets each screen density take the
              // smallest file that is still sharp.
              sizes={`${LAYOUT[sticker.id].width}px`}
              loading={sticker.id === "keyboard" ? "eager" : "lazy"}
              fetchPriority={sticker.id === "keyboard" ? "high" : "auto"}
              className="h-auto w-full object-contain"
              draggable={false}
            />
          </button>
        ))}
      </div>

      {storyRequested ? (
        <MobileStickerStory
          onOpenChange={handleOpenChange}
          onRaisedExitComplete={handleRaisedExitComplete}
          open={drawerOpen}
          raisedSticker={raisedSticker}
          setRaisedSticker={setRaisedSticker}
          sticker={openSticker}
        />
      ) : null}
    </section>
  );
}
