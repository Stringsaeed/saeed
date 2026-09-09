"use client";

import { RiCloseLine } from "@remixicon/react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import Image from "next/image";
import {
  type MouseEvent,
  useCallback,
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
import { cn } from "@/lib/utils";
import { STICKERS, type StickerDefinition } from "./sticker-data";

const LAYOUT: Record<StickerDefinition["id"], string> = {
  keyboard: "left-2 top-3 w-36 -rotate-8",
  monstera: "right-2 top-1 w-28 rotate-6",
  bass: "left-6 bottom-1 w-24 rotate-3",
  controller: "right-3 bottom-3 w-36 -rotate-3",
};
const BACKDROP_PADDING = 24;
const OPEN_DURATION = 0.55;
const CLOSE_DURATION = 0.45;

type RaisedSticker = {
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
        quality={90}
        className="object-contain"
        draggable={false}
      />
    </div>
  );
}

export function MobileStickerField() {
  const drawerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openId, setOpenId] = useState<StickerDefinition["id"] | null>(null);
  const [raisedSticker, setRaisedSticker] = useState<RaisedSticker | null>(
    null,
  );
  const openSticker = STICKERS.find((sticker) => sticker.id === openId);
  const resolvedRaisedSticker = isResolvedRaisedSticker(raisedSticker)
    ? raisedSticker
    : null;

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
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setDrawerOpen(isOpen);
  }, []);

  const handleRaisedExitComplete = useCallback(() => {
    setOpenId(null);
    setRaisedSticker(null);
  }, []);

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
  ]);

  return (
    <section aria-label="Sticker stories" className="mt-8 min-[960px]:hidden">
      <h2 className="list-heading">Sticker desk</h2>
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
            data-sticker-id={sticker.id}
            onClick={selectSticker}
            aria-label={`Open ${sticker.label.toLowerCase()} sticker story`}
            className={cn(
              "absolute drop-shadow-xl transition-[scale,filter] duration-300 ease-out active:scale-95",
              LAYOUT[sticker.id],
              openId === sticker.id &&
                typeof raisedSticker?.targetScale === "number" &&
                "opacity-0",
            )}
          >
            <Image
              src={sticker.src}
              alt=""
              width={160}
              height={Math.round((160 * sticker.height) / sticker.width)}
              sizes="calc(100vw - 3rem)"
              quality={90}
              className="h-auto w-full object-contain"
              draggable={false}
            />
          </button>
        ))}
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={handleOpenChange}
        modal
        showSwipeHandle
      >
        <DrawerContent
          ref={drawerRef}
          className="[--bleed:0px] [--drawer-inset:0.75rem] rounded-[28px] border"
        >
          {openSticker ? (
            <div className="px-5 pt-2 pb-5">
              <div className="flex justify-end">
                <DrawerTitle className="sr-only">
                  {openSticker.label} sticker story
                </DrawerTitle>
                <DrawerClose
                  aria-label="Close sticker story"
                  className="inline-flex size-9 items-center justify-center rounded-full bg-accent text-foreground transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <RiCloseLine aria-hidden="true" className="size-5" />
                </DrawerClose>
              </div>
              <DrawerDescription className="mt-1 text-[15px] leading-6 text-pretty text-foreground">
                {openSticker.story}
              </DrawerDescription>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      {openSticker && resolvedRaisedSticker
        ? createPortal(
            <RaisedStickerOverlay
              geometry={resolvedRaisedSticker}
              onExitComplete={handleRaisedExitComplete}
              open={drawerOpen}
              reduceMotion={shouldReduceMotion ?? false}
              sticker={openSticker}
            />,
            document.body,
          )
        : null}
    </section>
  );
}
