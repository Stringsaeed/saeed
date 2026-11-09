"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { type Platform, usePlatform } from "./platform";

// A live mesh gradient behind the home screen, in each platform's palette.
// The CSS fallback gradient (os.css) paints first and stays under it, so a
// machine without WebGL2, or one asking for less motion, still gets a
// wallpaper.

const palettes: Record<Exclude<Platform, "web">, Record<"light" | "dark", string[]>> =
  {
    ios: {
      light: [
        "#6f9dff",
        "#b48cff",
        "#ff8bb5",
        "#ffc17d",
        "#8fd8ff",
      ],
      dark: [
        "#141a4d",
        "#3a2a86",
        "#0b3a72",
        "#5a2a6e",
        "#0a0a16",
      ],
    },
    android: {
      light: [
        "#bfeedb",
        "#62c4a1",
        "#ffd98a",
        "#f6faf8",
        "#8fd9bf",
      ],
      dark: [
        "#0f2b25",
        "#1b5a48",
        "#2a3a2e",
        "#0f1513",
        "#355f52",
      ],
    },
  };

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useWebGL2() {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    setSupported(Boolean(gl));
  }, []);
  return supported;
}

export function Wallpaper() {
  const { platform } = usePlatform();
  const { resolvedTheme } = useTheme();
  const reduced = useReducedMotion();
  const webgl = useWebGL2();
  if (platform === "web") return null;
  const palette = palettes[platform][resolvedTheme === "dark" ? "dark" : "light"];
  return (
    <div className="os-wallpaper" aria-hidden="true">
      {webgl ? (
        <MeshGradient
          colors={palette}
          distortion={0.8}
          swirl={0.35}
          grainMixer={0}
          grainOverlay={0.08}
          speed={reduced ? 0 : 0.16}
        />
      ) : null}
    </div>
  );
}
