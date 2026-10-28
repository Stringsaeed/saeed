"use client";

import {
  type ComponentType,
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
import type { StickerDisplayProps } from "./_variants/types";
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
  const isDesk = variant.kind === "desk";

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
  // each sticker from the pile into the desk.
  const openFromPile = useCallback(() => {
    startTransition(() => {
      setMountKey((key) => key + 1);
      setOpen(true);
    });
  }, []);

  // Replay. Desks drop back to the pile, then open again so the entrance
  // re-runs. Inline and standalone variants simply re-mount.
  const replay = useCallback(() => {
    if (!isDesk) {
      setMountKey((key) => key + 1);
      return;
    }
    flushSync(() => setOpen(false));
    requestAnimationFrame(() => requestAnimationFrame(openFromPile));
  }, [
    isDesk,
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

  // Same page lock the site's modal applies while a desk is open.
  useEffect(() => {
    if (!isDesk || !open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [
    isDesk,
    open,
  ]);

  const key = `${current}-${mountKey}`;
  const Desk = variant.Component as ComponentType<StickerDisplayProps>;
  const Section = variant.Component as ComponentType;

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
            <h1 className="backdrop-plate max-w-136 text-xl leading-8 font-semibold tracking-tight sm:text-2xl sm:leading-9">
              I’m Saeed, a software engineer.
            </h1>
            <p className="backdrop-plate mt-3 max-w-152 text-base leading-7 text-muted-foreground">
              I work on React Native, TypeScript, performance, accessibility,
              native code, and agent-assisted engineering.
            </p>
            {variant.kind === "inline" ? (
              <div className="mt-12" data-prototype-inline>
                <Section key={key} />
              </div>
            ) : null}
            <p className="mt-12 font-mono text-[11.5px] text-muted-foreground">
              Prototype · {variant.name} · {variant.axis}
            </p>
            {/* Enough page below to judge how the variant sits in a scroll. */}
            <div className="mt-12 space-y-3" aria-hidden>
              <p className="list-heading backdrop-plate">Work</p>
              <div className="h-40 rounded-xl border border-border/60" />
              <p className="list-heading backdrop-plate pt-6">Writing</p>
              <div className="h-32 rounded-xl border border-border/60" />
            </div>
          </main>
        </div>
        {isDesk && !open ? <PrototypePile onOpen={openFromPile} /> : null}
        {variant.kind === "standalone" ? <Section key={key} /> : null}
      </div>
      {isDesk && open ? (
        <div ref={deskRef} className="contents">
          <Desk key={key} onClose={close} />
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
