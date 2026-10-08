"use client";

import { RiCloseLine } from "@remixicon/react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import Image from "next/image";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { StickerDefinition } from "./sticker-data";

const BACKDROP_PADDING = 24;
const OPEN_DURATION = 0.55;
const CLOSE_DURATION = 0.45;
export type RaisedSticker = {
  boundsHeight: number;
  boundsWidth: number;
  height: number;
  originX: number;
  originY: number;
  rotate: string;
  targetCenterX: number | null;
  targetCenterY: number | null;
  targetScale: number | null;
  width: number;
};

type ResolvedRaisedSticker = RaisedSticker & {
  targetCenterX: number;
  targetCenterY: number;
  targetScale: number;
};

function isResolvedRaisedSticker(
  sticker: RaisedSticker | null,
): sticker is ResolvedRaisedSticker {
  return (
    sticker !== null &&
    sticker.targetCenterX !== null &&
    sticker.targetCenterY !== null &&
    sticker.targetScale !== null
  );
}

type RaisedStickerOverlayProps = {
  geometry: ResolvedRaisedSticker;
  onExitComplete: () => void;
  open: boolean;
  reduceMotion: boolean;
  sticker: StickerDefinition;
};

function RaisedStickerOverlay({
  geometry,
  onExitComplete,
  open,
  reduceMotion,
  sticker,
}: RaisedStickerOverlayProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const targetWidth = geometry.width * geometry.targetScale;
  const targetHeight = geometry.height * geometry.targetScale;
  const targetLeft = geometry.targetCenterX - targetWidth / 2;
  const targetTop = geometry.targetCenterY - targetHeight / 2;
  const originOffsetX = geometry.originX - geometry.targetCenterX;
  const originOffsetY = geometry.originY - geometry.targetCenterY;
  const inverseScale = 1 / geometry.targetScale;
  const rotation = Number.parseFloat(geometry.rotate) || 0;

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    gsap.killTweensOf(element);

    if (open) {
      gsap.fromTo(
        element,
        {
          x: originOffsetX,
          y: originOffsetY,
          scale: inverseScale,
          rotation,
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          rotation,
          duration: reduceMotion ? 0 : OPEN_DURATION,
          ease: "power4.out",
          force3D: true,
          overwrite: true,
        },
      );
    } else {
      gsap.to(element, {
        x: originOffsetX,
        y: originOffsetY,
        scale: inverseScale,
        rotation,
        duration: reduceMotion ? 0 : CLOSE_DURATION,
        ease: "power3.inOut",
        force3D: true,
        overwrite: true,
        onComplete: onExitComplete,
      });
    }

    return () => {
      gsap.killTweensOf(element);
    };
  }, [
    inverseScale,
    onExitComplete,
    open,
    originOffsetX,
    originOffsetY,
    reduceMotion,
    rotation,
  ]);

  return (
    <div
      ref={elementRef}
      aria-hidden
      data-raised-sticker
      className="pointer-events-none fixed z-[60] drop-shadow-2xl"
      style={{
        left: targetLeft,
        top: targetTop,
        width: targetWidth,
        height: targetHeight,
        transformOrigin: "center",
        willChange: "transform",
      }}
    >
      <Image
        src={sticker.src}
        alt=""
        fill
        sizes="calc(100vw - 3rem)"
        className="object-contain"
        draggable={false}
      />
    </div>
  );
}

type MobileStickerStoryProps = {
  onOpenChange: (open: boolean) => void;
  onRaisedExitComplete: () => void;
  open: boolean;
  raisedSticker: RaisedSticker | null;
  setRaisedSticker: Dispatch<SetStateAction<RaisedSticker | null>>;
  sticker: StickerDefinition | undefined;
};

// The drawer, its GSAP flight, and Motion load after the page settles, so the
// desk itself paints with nothing but its images.
export function MobileStickerStory({
  onOpenChange,
  onRaisedExitComplete,
  open,
  raisedSticker,
  setRaisedSticker,
  sticker,
}: MobileStickerStoryProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  // Mount closed first even when a tap arrived before this module did, so the
  // drawer always gets its opening transition.
  const [mounted, setMounted] = useState(false);
  const drawerOpen = open && mounted;
  const resolvedRaisedSticker = isResolvedRaisedSticker(raisedSticker)
    ? raisedSticker
    : null;

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!drawerOpen) return;

    const centerSticker = () => {
      const drawer = drawerRef.current;
      if (!drawer) return;

      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const drawerBottomInset =
        Number.parseFloat(getComputedStyle(drawer).marginBottom) || 0;
      const backdropBottom =
        viewportTop + viewportHeight - drawer.offsetHeight - drawerBottomInset;
      const availableWidth = Math.max(0, viewportWidth - BACKDROP_PADDING * 2);
      const availableHeight = Math.max(
        0,
        backdropBottom - viewportTop - BACKDROP_PADDING * 2,
      );

      setRaisedSticker((current) =>
        current
          ? {
              ...current,
              targetCenterX: viewportLeft + viewportWidth / 2,
              targetCenterY: viewportTop + (backdropBottom - viewportTop) / 2,
              targetScale: Math.max(
                0.1,
                Math.min(
                  availableWidth / current.boundsWidth,
                  availableHeight / current.boundsHeight,
                ),
              ),
            }
          : null,
      );
    };

    const frame = requestAnimationFrame(centerSticker);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    drawerOpen,
    setRaisedSticker,
  ]);

  return (
    <>
      <Drawer
        open={drawerOpen}
        onOpenChange={onOpenChange}
        modal
        showSwipeHandle
      >
        <DrawerContent
          ref={drawerRef}
          className="[--bleed:0px] [--drawer-inset:0.75rem] rounded-[28px] border"
        >
          {sticker ? (
            <div className="px-5 pt-2 pb-5">
              <div className="flex justify-end">
                <DrawerTitle className="sr-only">
                  {sticker.label} sticker story
                </DrawerTitle>
                <DrawerClose
                  aria-label="Close sticker story"
                  data-sound="tap"
                  className="inline-flex size-9 items-center justify-center rounded-full bg-accent text-foreground transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <RiCloseLine aria-hidden="true" className="size-5" />
                </DrawerClose>
              </div>
              <DrawerDescription className="mt-1 text-[15px] leading-6 text-pretty text-foreground">
                {sticker.story}
              </DrawerDescription>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      {sticker && resolvedRaisedSticker
        ? createPortal(
            <RaisedStickerOverlay
              geometry={resolvedRaisedSticker}
              onExitComplete={onRaisedExitComplete}
              open={drawerOpen}
              reduceMotion={shouldReduceMotion ?? false}
              sticker={sticker}
            />,
            document.body,
          )
        : null}
    </>
  );
}
