"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { usePathname } from "next/navigation";
import {
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { builtInApps } from "@/data/apps";
import type { BlogPost } from "@/lib/content";
import { playSound } from "@/lib/sound";
import { LockScreen } from "./lock-screen";
import { usePlatform } from "./platform";
import { SidePanel } from "./side-panel";
import { StatusBar } from "./status-bar";
import { Wallpaper } from "./wallpaper";
import { WebShell } from "./web-shell";

// The device. On a desktop it stands in a room beside a short introduction,
// tilts toward the pointer, and scales to the window. On a phone the frame
// goes away and the screen is the page. On the web platform there is no
// device at all.

const ZOOM_MARGIN = 72;
const FRAME_H = 900;
const FRAME_W = 452;

function fitZoom() {
  const z = Math.min(
    1,
    (window.innerHeight - ZOOM_MARGIN) / FRAME_H,
    (window.innerWidth * 0.48) / FRAME_W,
  );
  return Math.max(0.5, z);
}

function useDeviceZoom() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.style.setProperty(
        "--device-zoom",
        fitZoom().toFixed(3),
      );
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
}

function appNameFor(pathname: string) {
  if (pathname === "/") return null;
  return (
    builtInApps.find(
      (app) =>
        app.href !== "/" &&
        (pathname === app.href || pathname.startsWith(`${app.href}/`)),
    )?.name ?? null
  );
}

export function DeviceShell({
  children,
  posts,
}: {
  children: ReactNode;
  posts: readonly BlogPost[];
}) {
  const { platform } = usePlatform();
  if (platform === "web") return <WebShell>{children}</WebShell>;
  return <Phone posts={posts}>{children}</Phone>;
}

function Phone({
  children,
  posts,
}: {
  children: ReactNode;
  posts: readonly BlogPost[];
}) {
  const { platform } = usePlatform();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [locked, setLocked] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  useDeviceZoom();

  // The island announces the app as it opens.
  useEffect(() => {
    const name = appNameFor(pathname);
    if (!name) return;
    setNote(name);
    const id = window.setTimeout(() => setNote(null), 1500);
    return () => window.clearTimeout(id);
  }, [
    pathname,
  ]);

  const stageRef = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, {
    stiffness: 120,
    damping: 20,
    mass: 0.6,
  });
  const sy = useSpring(py, {
    stiffness: 120,
    damping: 20,
    mass: 0.6,
  });
  const rotateY = useTransform(sx, [
    0,
    1,
  ], [
    -7,
    7,
  ]);
  const rotateX = useTransform(sy, [
    0,
    1,
  ], [
    6,
    -6,
  ]);
  const glareX = useMotionTemplate`${useTransform(sx, (v) => v * 100)}%`;
  const glareY = useMotionTemplate`${useTransform(sy, (v) => v * 100)}%`;

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (reduced || event.pointerType !== "mouse") return;
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      px.set((event.clientX - rect.left) / rect.width);
      py.set((event.clientY - rect.top) / rect.height);
    },
    [
      px,
      py,
      reduced,
    ],
  );
  const onPointerLeave = useCallback(() => {
    px.set(0.5);
    py.set(0.5);
  }, [
    px,
    py,
  ]);

  const toggleLock = useCallback(() => {
    playSound("select");
    setLocked((value) => !value);
  }, []);
  const unlock = useCallback(() => {
    playSound("tap");
    setLocked(false);
  }, []);

  const surface = pathname === "/" || locked ? "home" : "app";

  return (
    <div
      ref={stageRef}
      className="os-stage"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <SidePanel />
      <motion.div
        className="os-device"
        style={
          reduced
            ? undefined
            : {
                rotateX,
                rotateY,
                // Typed as CSSProperties; custom properties are fine at runtime.
                ["--os-glare-x" as string]: glareX,
                ["--os-glare-y" as string]: glareY,
              }
        }
      >
        <div className="os-frame" data-platform={platform}>
          <div className="os-hardware">
            <button
              type="button"
              className="os-btn os-btn-power"
              aria-label={locked ? "Unlock the phone" : "Lock the phone"}
              aria-pressed={locked}
              title="Side button"
              onClick={toggleLock}
            />
            <button
              type="button"
              className="os-btn os-btn-action"
              aria-label="Action button"
              title="Action button"
              onClick={() => playSound("select")}
            />
            <button
              type="button"
              className="os-btn os-btn-vol-up"
              aria-label="Volume up"
              title="Volume up"
              onClick={() => playSound("tap")}
            />
            <button
              type="button"
              className="os-btn os-btn-vol-down"
              aria-label="Volume down"
              title="Volume down"
              onClick={() => playSound("tap")}
            />
          </div>
          <div
            className="os-screen"
            data-surface={surface}
            data-locked={locked}
          >
            <Wallpaper />
            <StatusBar />
            <div className="os-cutout">
              {platform === "ios" ? (
                <div className="os-island" data-expanded={note !== null}>
                  <span className="os-island-note" aria-hidden="true">
                    {note}
                  </span>
                  <span className="os-island-camera" />
                </div>
              ) : (
                <div className="os-hole" />
              )}
            </div>
            <div className="os-viewport" inert={locked || undefined}>
              {children}
            </div>
            <div className="os-home-indicator" />
            <LockScreen locked={locked} onUnlock={unlock} posts={posts} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
