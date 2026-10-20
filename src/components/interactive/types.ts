import type { InteractiveName } from "@/lib/interactive-names";

/** Props every registered figure receives from the post body. The caption
 *  is not among them: the server renders it outside the figure's chunk. */
export type InteractiveFigureProps = {
  name: InteractiveName;
};

// Rules for figure authors
//
// - Wrap everything in <Figure>. Its title/controls row and stage size
//   must match the figure's registry entry (`header`, and `aspect` or
//   `minHeight`), or the post shifts when the chunk loads; a header
//   mismatch warns in dev. A `minHeight` figure grows with its content and
//   must never scroll inside itself; measure its mounted height at 375px
//   and 688px wide.
//
// - Animate through useFigureLoop(callback), never a raw
//   requestAnimationFrame. It runs only while the figure is playing, on
//   screen, and the tab is visible, and stops on unmount. Anything that
//   moves for more than five seconds puts <FigurePlayButton /> in
//   `controls` (WCAG 2.2.2). Under reduced motion figures start paused;
//   read `reducedMotion` from useFigure() to show end states instead of
//   tweens.
//
// - Focus inside the stage is drawn inset. The surface clips to its radius
//   (overflow: clip), which would cut off an outline or ring drawn outside
//   a control touching the stage edge, so globals.css gives every
//   `[data-figure-stage] :focus-visible` a 2px outline at
//   `outline-offset: -2px`. Custom focus styles in the stage must stay
//   inside the element's box too.
//
// - Modules that drive the vendored simulation (mutable objects updated
//   in place every frame) start with the "use no memo" directive. The
//   React Compiler is on (`reactCompiler: true`) and assumes values are
//   immutable, so it can memoize reads of state that has changed under it.
