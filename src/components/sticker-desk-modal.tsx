"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { StickerDesk } from "./sticker-desk";
import { closeDeskWithTransition } from "./sticker-transition";

export function StickerDeskModal() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog) closeDeskWithTransition(dialog, () => router.back());
    else router.back();
  }, [
    router,
  ]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.focus({
      preventScroll: true,
    });
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({
          preventScroll: true,
        });
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-8">
      <div
        aria-hidden="true"
        className="sticker-backdrop fixed inset-0 bg-background/40 backdrop-blur-xl backdrop-saturate-150"
        onClick={close}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sticker desk"
        tabIndex={-1}
        className="sticker-panel relative w-full max-w-176 rounded-[32px] bg-background/55 p-5 shadow-surface-6 ring-1 ring-foreground/10 backdrop-blur-2xl outline-none sm:p-8"
      >
        <StickerDesk onClose={close} />
      </div>
    </div>
  );
}
