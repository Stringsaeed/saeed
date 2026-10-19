"use client";

import { Dithering } from "@paper-design/shaders-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

// Paper Shaders throws without WebGL2; render nothing instead. The probe
// context is released straight away.
function useWebGL2() {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    setSupported(Boolean(gl));
  }, []);
  return supported;
}

// Paper's dithering shader: a slow 4×4 Bayer-dithered warp glowing behind
// the header, masked away before the content gets dense. Fixed and inert,
// under the content; frozen for reduced motion.
export function SiteBackdrop() {
  const { resolvedTheme } = useTheme();
  const reduced = usePrefersReducedMotion();
  const webgl = useWebGL2();
  if (!webgl) return null;
  const dark = resolvedTheme !== "light";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 print:hidden forced-colors:hidden"
      style={{
        maskImage:
          "radial-gradient(ellipse 85% 60% at 50% 0%, black 10%, transparent 75%)",
        opacity: dark ? 0.55 : 0.4,
      }}
    >
      <Dithering
        className="size-full"
        colorBack="#00000000"
        colorFront={dark ? "#3a3a44" : "#c9c9d2"}
        shape="warp"
        type="4x4"
        size={2.5}
        speed={reduced ? 0 : 0.18}
        scale={1.1}
      />
    </div>
  );
}
