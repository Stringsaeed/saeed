// Canvas helpers for the vendored explainer figures (see PATCHES in scripts/sync-pewpew.ts).
//
// Font: upstream draws canvas labels in "Paper Mono", the family its own page loads. The site loads the same font
// through next/font, which gives it a generated family name, so the island reads the real family from the figure's
// CSS once at mount (setCanvasFontFamily) and the patched drawing code asks for it here.
//
// Pointer: upstream canvases have a fixed CSS size and read pointer positions in CSS pixels. Here a canvas shrinks to
// fit narrow screens (pewpew-figure.css), so pointer positions are mapped back to the canvas's own drawing units.

let fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";

export function setCanvasFontFamily(family: string): void {
  if (family.trim() !== "") fontFamily = family;
}

/** A canvas `font` string at `px` pixels in the site's mono family. */
export function canvasFont(px: number): string {
  return `${px}px ${fontFamily}`;
}

// Drawing units come from the fixed inline size canvas2d() (world2d.ts) sets, not from the backing store and the
// current devicePixelRatio, so zooming or moving the window to another screen after mount cannot skew them.

/** A pointer's clientX as an x in the canvas's drawing units, however wide the canvas is shown. */
export function canvasX(canvas: HTMLCanvasElement, clientX: number): number {
  const rect = canvas.getBoundingClientRect();
  return ((clientX - rect.left) * parseFloat(canvas.style.width)) / rect.width;
}

/** A pointer's clientY as a y in the canvas's drawing units, however tall the canvas is shown. */
export function canvasY(canvas: HTMLCanvasElement, clientY: number): number {
  const rect = canvas.getBoundingClientRect();
  return ((clientY - rect.top) * parseFloat(canvas.style.height)) / rect.height;
}
