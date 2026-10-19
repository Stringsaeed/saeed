"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { SiteBackdrop } from "@/components/site-backdrop";
import { SiteHeader } from "@/components/site-header";
import { closeDeskWithTransition } from "@/components/sticker-transition";
import { ThemeProvider } from "@/components/theme-provider";
import { playSound } from "@/lib/sound";
import { Picker } from "../_picker/picker";
import { VARIANTS } from "./_variants/registry";
import { PrototypePile } from "./prototype-pile";

export function StickerPrototypeHarness({
  initialIndex,
}: {
  initialIndex: number;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const [open, setOpen] = useState(true);
  const [mountKey, setMountKey] = useState(0);
  const deskRef = useRef<HTMLDivElement>(null);
  const variant = VARIANTS[current];

  const select = useCallback((index: number) => {
    if (index < 0 || index >= VARIANTS.length) return;
    setCurrent(index);
    setOpen(true);
    setMountKey((key) => key + 1);
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(index + 1));
    window.history.replaceState(null, "", url);
  }, []);

  // Open from the pile the way the site does: a React view transition morphs
  // each sticker from the pile into the variant.
  const openFromPile = useCallback(() => {
    startTransition(() => {
      setMountKey((key) => key + 1);
      setOpen(true);
    });
  }, []);

  // Replay = drop back to the pile, then open again so the entrance re-runs.
  const replay = useCallback(() => {
    flushSync(() => setOpen(false));
    requestAnimationFrame(() => requestAnimationFrame(openFromPile));
  }, [
    openFromPile,
  ]);

  const close = useCallback(() => {
    playSound("deskClose");
    const desk = deskRef.current;
    const goBack = () => flushSync(() => setOpen(false));
    if (desk) closeDeskWithTransition(desk, goBack);
    else goBack();
  }, []);

  // Variants handle their own keys first; anything they preventDefault on
  // (arrows inside a gallery, Escape) never reaches the picker.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number.parseInt(event.key, 10);
      if (number >= 1 && number <= VARIANTS.length) select(number - 1);
      else if (event.key === "ArrowRight")
        select((current + 1) % VARIANTS.length);
      else if (event.key === "ArrowLeft")
        select((current - 1 + VARIANTS.length) % VARIANTS.length);
      else if (event.key === "r" || event.key === "R") replay();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    current,
    select,
    replay,
  ]);

  // Same page lock the site's modal applies while the desk is open.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [
    open,
  ]);

  const { Component } = variant;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="relative isolate min-h-screen overflow-x-clip">
        <SiteBackdrop />
        {/* Realistic surroundings: the home page column the desk opens over. */}
        <div className="site-layout relative z-10 mx-auto flex min-h-dvh w-full max-w-176 flex-col px-6 sm:px-8">
          <SiteHeader />
          <main className="pt-10 pb-20 sm:pt-14">
            <p className="max-w-[34rem] text-lg text-pretty text-foreground">
              Software engineer in Dubai, building React Native and web apps for
              fintech and marketplaces.
            </p>
            <p className="mt-4 max-w-[34rem] text-pretty text-muted-foreground">
              The pile in the corner opens the desk: eight things I keep close,
              and the stories behind them.
            </p>
            <p className="mt-10 font-mono text-[11.5px] text-muted-foreground">
              Prototype · {variant.name} · {variant.axis}
            </p>
          </main>
        </div>
        {open ? null : <PrototypePile onOpen={openFromPile} />}
      </div>
      {open ? (
        <div ref={deskRef} className="contents">
          <Component key={`${current}-${mountKey}`} onClose={close} />
        </div>
      ) : null}
      <Picker
        items={VARIANTS.map((item) => ({
          name: item.name,
          title: item.axis,
        }))}
        current={current}
        position={variant.pickerPosition}
        onSelect={select}
        onReplay={replay}
      />
    </ThemeProvider>
  );
}
