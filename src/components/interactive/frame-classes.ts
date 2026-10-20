// Shared by the server-rendered post shell (post-body.tsx) and the client
// Figure, so the frame a reader sees before and after the figure's code
// loads is the same box.

export const figureClass = "space-y-2.5";

export const figcaptionClass =
  "px-1 font-mono text-[11px] leading-5 text-muted-foreground";

/** The site's outlined surface (as on the home page Work card). `overflow-
 *  clip` keeps the radius clipping without making a scroll container; see
 *  types.ts for the inset-focus rule this implies for stage children. */
export const surfaceClass =
  "relative overflow-clip text-foreground smooth-shadow-ring shadow-black smooth-ring-neutral-300/30 bg-background";

/** Fixed height so the skeleton and the real header match exactly. */
export const headerClass =
  "flex h-11 items-center justify-between gap-3 px-4 pt-3";
