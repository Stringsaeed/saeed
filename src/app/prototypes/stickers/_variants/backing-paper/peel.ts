import type { Corner, Frame } from "./frames";

// The motion of one sticker coming off and going back. Every transform in
// here hinges on the corner opposite the one being peeled: a sticker that
// turns about its centre reads as a card flipping, one that pivots on the
// corner still stuck down reads as adhesive letting go.

export const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const PEEL_MS = 420;
const CARRY_MS = 360;
const PRESS_MS = 260;
const PERSPECTIVE = 900;
// Lying on the liner, set down by hand.
const HELD_ROT = -5;
const LIFT_TILT = 28;

// Kiss-cut shadows: a hairline where the cut meets the stock, then the cast
// shadow that opens up as the sticker leaves. Same two-layer shape at every
// step so the filter interpolates instead of snapping.
const SHADOW_FLAT =
  "drop-shadow(0 0 0.6px rgb(70 50 20 / 0.45)) drop-shadow(0 1px 1px rgb(70 50 20 / 0.14))";
const SHADOW_LIFT =
  "drop-shadow(0 0 0.6px rgb(70 50 20 / 0.25)) drop-shadow(16px 28px 18px rgb(40 25 5 / 0.32))";
export const SHADOW_HELD =
  "drop-shadow(0 0 0.6px rgb(70 50 20 / 0.3)) drop-shadow(6px 14px 12px rgb(40 25 5 / 0.28))";

const FAR: Record<
  Corner,
  [
    number,
    number,
  ]
> = {
  tl: [
    1,
    1,
  ],
  tr: [
    0,
    1,
  ],
  bl: [
    1,
    0,
  ],
  br: [
    0,
    0,
  ],
};

/** transform-origin for a sticker peeled from `corner`. */
export function hinge(corner: Corner) {
  const [x, y] = FAR[corner];
  return `${x * 100}% ${y * 100}%`;
}

/**
 * The tilt axis: in the sheet's plane, square to the diagonal from the hinge
 * to the grabbed corner, so that corner rises toward the reader.
 */
export function tiltAxis(corner: Corner): [
  number,
  number,
] {
  const [fx, fy] = FAR[corner];
  const dx = 1 - fx - fx;
  const dy = 1 - fy - fy;
  return [
    dy * Math.SQRT1_2,
    -dx * Math.SQRT1_2,
  ];
}

type Pose = {
  x: number;
  y: number;
  scale: number;
  tilt: number;
  rot: number;
};

function transform(pose: Pose, corner: Corner) {
  const [ax, ay] = tiltAxis(corner);
  return `translate(${pose.x}px, ${pose.y}px) scale(${pose.scale}) perspective(${PERSPECTIVE}px) rotate3d(${ax}, ${ay}, 0, ${pose.tilt}deg) rotate(${pose.rot}deg)`;
}

export function heldTransform(corner: Corner) {
  return transform(
    {
      x: 0,
      y: 0,
      scale: 1,
      tilt: 0,
      rot: HELD_ROT,
    },
    corner,
  );
}

// Where `box` sits relative to `target`, measured hinge to hinge: the
// translate and scale that land `target` exactly on `box`.
function offset(box: DOMRect, target: DOMRect, corner: Corner) {
  const [fx, fy] = FAR[corner];
  return {
    x: box.left + fx * box.width - (target.left + fx * target.width),
    y: box.top + fy * box.height - (target.top + fy * target.height),
    scale: target.width ? box.width / target.width : 1,
  };
}

/**
 * Peel: lift off the cell about the far corner, cast shadow opening mid-arc,
 * then carry the sticker down and set it on the liner.
 * `from` is the cell's box, `to` the held slot's box (both untransformed).
 */
export function peelOff(
  element: HTMLElement,
  from: DOMRect,
  to: DOMRect,
  corner: Corner,
) {
  const start = offset(from, to, corner);
  const lifted = {
    // Already drifting toward the liner as it comes free.
    x: start.x * 0.92,
    y: start.y * 0.92,
    scale: start.scale * 1.04,
    tilt: LIFT_TILT,
    rot: HELD_ROT * 0.3,
  };
  const total = PEEL_MS + CARRY_MS;
  return element.animate(
    [
      {
        offset: 0,
        transform: transform(
          {
            ...start,
            tilt: 0,
            rot: 0,
          },
          corner,
        ),
        filter: SHADOW_FLAT,
        easing: EASE,
      },
      {
        offset: PEEL_MS / total,
        transform: transform(lifted, corner),
        filter: SHADOW_LIFT,
        easing: "cubic-bezier(0.45, 0, 0.2, 1)",
      },
      {
        offset: 1,
        transform: heldTransform(corner),
        filter: SHADOW_HELD,
      },
    ],
    {
      duration: total,
    },
  );
}

/**
 * Press back: from wherever the held sticker is now to its cell, landing in
 * the slightly-off re-stuck pose. Faster than the peel: putting something
 * back takes less care than taking it off.
 */
export function pressBack(
  element: HTMLElement,
  from: DOMRect,
  to: DOMRect,
  frame: Frame,
  current: string,
) {
  const end = offset(to, from, frame.corner);
  return element.animate(
    [
      {
        transform: current,
        filter: SHADOW_HELD,
      },
      {
        transform: transform(
          {
            x: end.x + frame.restick.x,
            y: end.y + frame.restick.y,
            scale: end.scale,
            tilt: 0,
            rot: frame.restick.r,
          },
          frame.corner,
        ),
        filter: SHADOW_FLAT,
      },
    ],
    {
      duration: PRESS_MS,
      easing: EASE,
      fill: "forwards",
    },
  );
}
