export type BookDimensions = {
  width: number;
  height: number;
  depth: number;
};

export type PulledBookSize = BookDimensions & {
  perspective: number;
  // How far a rounded spine stands proud of the covers' spine-side edge. Zero
  // for a square back.
  spineBulge: number;
};

export type Box = {
  left: number;
  top: number;
  width: number;
  height: number;
};

// Resting pose of a pulled book: turned far enough to read the cover while
// the spine and the top of the page block stay in view.
export const REST_ROTATE_Y = 30;
export const REST_ROTATE_X = -16;
// On the shelf the spine faces the viewer, a quarter turn from the cover.
export const SHELF_ROTATE_Y = 90;

const MAX_HEIGHT = 440;
const MIN_HEIGHT = 160;
const VIEWPORT_HEIGHT_RATIO = 0.5;
const VIEWPORT_GUTTER = 72;
const PERSPECTIVE_RATIO = 3.4;

// Pixel size of the pulled book: half the viewport tall, capped, and narrow
// enough that the cover still fits when it is turned face-on.
export function pulledBookSize(
  book: BookDimensions & {
    spineRound?: number;
  },
  viewport: {
    width: number;
    height: number;
  },
): PulledBookSize {
  const widthLimit =
    (Math.max(0, viewport.width - VIEWPORT_GUTTER) * book.height) / book.width;
  const height = Math.max(
    MIN_HEIGHT,
    Math.min(viewport.height * VIEWPORT_HEIGHT_RATIO, MAX_HEIGHT, widthLimit),
  );
  const unit = height / book.height;

  return {
    width: book.width * unit,
    height,
    depth: book.depth * unit,
    perspective: height * PERSPECTIVE_RATIO,
    spineBulge: book.depth * unit * Math.min(book.spineRound ?? 0, 0.5),
  };
}

// Offset and scale that make the pulled book, turned spine-out, land exactly
// on its shelf slot. The spine sits half a cover-width (plus any bulge) in
// front of the pivot, so perspective magnifies it; the scale divides that
// back out.
export function shelfTransform(slot: Box, rest: Box, size: PulledBookSize) {
  const magnification =
    size.perspective / (size.perspective - size.width / 2 - size.spineBulge);

  return {
    x: slot.left + slot.width / 2 - (rest.left + rest.width / 2),
    y: slot.top + slot.height / 2 - (rest.top + rest.height / 2),
    scale: slot.height / (size.height * magnification),
  };
}

// Resistance past a limit: travel beyond `min`/`max` is damped so a drag
// never hits a hard stop.
export function rubberBand(value: number, min: number, max: number) {
  if (value < min) return min - Math.sqrt(min - value) * 2;
  if (value > max) return max + Math.sqrt(value - max) * 2;
  return value;
}

export type SpineStrip = {
  key: string;
  width: number;
  // Centre of the strip in the book's own space, and the way it faces.
  x: number;
  z: number;
  rotateY: number;
  // The slice of the flat spine drawing the strip carries: the drawing is
  // stretched across by `sliceScale` and shifted by `sliceOffset`.
  sliceOffset: number;
  sliceScale: number;
};

const SPINE_STRIPS = 11;
// Strips overlap their neighbours by this much so no seam shows between them.
const STRIP_OVERLAP = 0.5;

// A rounded spine as flat strips along half an ellipse: as deep as the book
// is thick and standing proud by the bulge, so it is nearly flat across the
// middle and turns tightly into each cover. The strips turn by equal angles,
// which leaves a broad one down the middle and ever narrower ones towards
// the shoulders. Every strip carries the slice of the spine drawing that sits
// behind it when the book is seen spine-on, so the rounded spine looks
// exactly like the flat drawing on the shelf and only reveals its curve as
// the book turns.
export function roundSpineStrips(size: PulledBookSize): SpineStrip[] {
  const { depth, spineBulge: bulge, width } = size;
  const half = depth / 2;
  // Where the curve has turned `step` strips of the way from the back cover
  // round to the front one.
  const point = (step: number) => {
    // Measured from the middle, so the two sides mirror each other exactly.
    const turn = ((step - SPINE_STRIPS / 2) / SPINE_STRIPS) * Math.PI;
    const angle =
      step === 0
        ? -Math.PI / 2
        : step === SPINE_STRIPS
          ? Math.PI / 2
          : Math.atan((half / bulge) * Math.tan(turn));

    return {
      x: -width / 2 - bulge * Math.cos(angle),
      z: half * Math.sin(angle),
    };
  };

  return Array.from(
    {
      length: SPINE_STRIPS,
    },
    (_, step) => {
      const from = point(step);
      const to = point(step + 1);
      const length = Math.hypot(to.x - from.x, to.z - from.z);
      const sliceScale = length / (to.z - from.z);

      return {
        key: `strip-${step}`,
        width: length + STRIP_OVERLAP * 2,
        x: (from.x + to.x) / 2,
        z: (from.z + to.z) / 2,
        rotateY: (Math.atan2(from.z - to.z, to.x - from.x) * 180) / Math.PI,
        sliceOffset: STRIP_OVERLAP - (from.z + half) * sliceScale,
        sliceScale,
      };
    },
  );
}
