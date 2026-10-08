"use client";

import { RiCloseLine } from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useState,
  ViewTransition,
} from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  STICKERS,
  type StickerDefinition,
  stickerTransitionName,
} from "./sticker-data";
import { playStickerSound } from "./sticker-sounds";
import { STICKER_ART_SIZES } from "./sticker-transition";

const CELL_SIZE = 160;

type StickerDeskProps = {
  // Present when the desk is a modal over the page; absent on the full page.
  onClose?: () => void;
};

const closeButtonClassName =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground transition-colors hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function StickerDesk({ onClose }: StickerDeskProps) {
  const [storyOpen, setStoryOpen] = useState(false);
  // Kept after closing so the drawer still has content while it slides out.
  const [storyId, setStoryId] = useState<StickerDefinition["id"] | null>(null);
  const story = STICKERS.find((sticker) => sticker.id === storyId);

  useEffect(() => {
    if (!onClose || storyOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [
    onClose,
    storyOpen,
  ]);

  const openStory = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const id = event.currentTarget.dataset.stickerId as
      | StickerDefinition["id"]
      | undefined;
    if (!id) return;
    playStickerSound(id);
    setStoryId(id);
    setStoryOpen(true);
  }, []);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="list-heading text-[2rem] text-foreground">Desk</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Things on my desk, and why they're there. Tap one for its story.
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="Close the sticker desk"
            className={closeButtonClassName}
            onClick={onClose}
            data-sound="tap"
          >
            <RiCloseLine aria-hidden="true" className="size-5" />
          </button>
        ) : (
          <Link
            href="/"
            aria-label="Back home"
            className={closeButtonClassName}
            data-sound="tap"
          >
            <RiCloseLine aria-hidden="true" className="size-5" />
          </Link>
        )}
      </div>

      <ul className="mt-6 grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3">
        {STICKERS.map((sticker) => {
          const fit = Math.min(
            (CELL_SIZE * 0.78) / sticker.width,
            (CELL_SIZE * 0.78) / sticker.height,
          );
          const selected = storyOpen && storyId === sticker.id;

          return (
            <li key={sticker.id}>
              <button
                type="button"
                aria-label={`Read the ${sticker.label.toLowerCase()} story`}
                aria-pressed={selected}
                data-sticker-id={sticker.id}
                onClick={openStory}
                className={cn(
                  "group/cell relative flex aspect-square w-full items-center justify-center rounded-2xl bg-foreground/3 p-[11%] ring-1 ring-foreground/5 transition-[background-color,box-shadow] duration-200 hover:bg-foreground/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:rounded-3xl",
                  selected && "bg-foreground/8 ring-foreground/15",
                )}
              >
                <ViewTransition
                  name={stickerTransitionName(sticker.id)}
                  share="sticker-morph"
                  default="none"
                >
                  <span
                    data-sticker-art={sticker.id}
                    className="block max-h-full max-w-full drop-shadow-lg transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cell:scale-105 group-hover/cell:-rotate-3 group-active/cell:scale-95"
                    style={{
                      aspectRatio: `${sticker.width} / ${sticker.height}`,
                      width: `${(sticker.width * fit * 100) / (CELL_SIZE * 0.78)}%`,
                    }}
                  >
                    <Image
                      src={sticker.src}
                      alt=""
                      width={Math.round(sticker.width * fit)}
                      height={Math.round(sticker.height * fit)}
                      sizes={STICKER_ART_SIZES}
                      loading="eager"
                      className="size-full object-contain"
                      draggable={false}
                    />
                  </span>
                </ViewTransition>
                <span className="pointer-events-none absolute inset-x-0 bottom-1.5 hidden text-center text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity duration-200 group-hover/cell:opacity-100 group-focus-visible/cell:opacity-100 sm:block">
                  {sticker.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Drawer
        open={storyOpen}
        onOpenChange={setStoryOpen}
        swipeDirection="right"
      >
        <DrawerContent className="[--bleed:0px] [--drawer-inset:0.75rem] rounded-[28px] border data-[swipe-direction=right]:rounded-l-[28px]">
          {story ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-6">
              <div className="flex items-start justify-between gap-4">
                {/* The span carries the font: DrawerTitle's own font-heading would override list-heading. */}
                <DrawerTitle>
                  <span className="list-heading text-[2rem] text-foreground">
                    {story.label}
                  </span>
                </DrawerTitle>
                <DrawerClose
                  aria-label="Close sticker story"
                  data-sound="tap"
                  className={closeButtonClassName}
                >
                  <RiCloseLine aria-hidden="true" className="size-5" />
                </DrawerClose>
              </div>
              <div className="my-8 flex justify-center">
                <Image
                  src={story.src}
                  alt=""
                  width={story.width}
                  height={story.height}
                  sizes={`${story.width}px`}
                  className="h-auto max-h-48 w-auto max-w-full rotate-[-4deg] object-contain drop-shadow-xl"
                  draggable={false}
                />
              </div>
              <DrawerDescription className="text-[15px] leading-7 text-pretty whitespace-pre-line text-foreground">
                {story.story}
              </DrawerDescription>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    </>
  );
}
