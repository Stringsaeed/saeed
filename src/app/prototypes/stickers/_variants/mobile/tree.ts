import { STICKERS, type StickerDefinition } from "@/components/sticker-data";

export type StickerId = StickerDefinition["id"];

// The mobile is a binary tree: seven arms carry eight leaves, in STICKERS
// order from left to right. Lengths are unitless; the stylesheet scales them
// (--u sideways, --v downwards) per breakpoint.
export type LeafNode = {
  kind: "leaf";
  index: number;
  sticker: StickerDefinition;
  // Visual mass: the sticker's area in its natural pixels.
  weight: number;
  // Thread from the arm end to the sticker. Short and long alternate so
  // neighbours hang at different heights and never touch.
  thread: number;
};

export type ArmNode = {
  kind: "arm";
  index: number;
  span: number;
  // Thread from the hook above to this arm's pivot.
  drop: number;
  left: TreeNode;
  right: TreeNode;
  weight: number;
  // Pivot as a fraction of the span from the left end. A lever balances when
  // each side's weight times its lever length match, so the heavy side is the
  // short one.
  pivot: number;
};

export type TreeNode = LeafNode | ArmNode;

const THREADS = [
  22,
  96,
  30,
  104,
  18,
  98,
  26,
  100,
];

export const LEAVES: LeafNode[] = STICKERS.map((sticker, index) => ({
  kind: "leaf",
  index,
  sticker,
  weight: sticker.width * sticker.height,
  thread: THREADS[index],
}));

function arm(
  index: number,
  span: number,
  drop: number,
  left: TreeNode,
  right: TreeNode,
): ArmNode {
  const weight = left.weight + right.weight;
  return {
    kind: "arm",
    index,
    span,
    drop,
    left,
    right,
    weight,
    pivot: right.weight / weight,
  };
}

// Giza and the Burj Khalifa share the first arm: two homes in balance.
const A3 = arm(3, 88, 60, LEAVES[0], LEAVES[1]);
const A4 = arm(4, 88, 48, LEAVES[2], LEAVES[3]);
const A5 = arm(5, 88, 44, LEAVES[4], LEAVES[5]);
const A6 = arm(6, 88, 66, LEAVES[6], LEAVES[7]);
const A1 = arm(1, 176, 52, A3, A4);
const A2 = arm(2, 176, 64, A5, A6);
export const ROOT = arm(0, 264, 36, A1, A2);

export const ARMS: ArmNode[] = [
  ROOT,
  A1,
  A2,
  A3,
  A4,
  A5,
  A6,
];

// Parent arm of each arm (-1 for the root) and of each leaf.
export const ARM_PARENT = [
  -1,
  0,
  0,
  1,
  1,
  2,
  2,
];
export const LEAF_PARENT = LEAVES.map((leaf) => {
  const parent = ARMS.find(
    (candidate) => candidate.left === leaf || candidate.right === leaf,
  );
  return parent ? parent.index : -1;
});

// Depth of the lowest hook, in --v units, for sizing the stage.
function depth(node: TreeNode, above: number): number {
  if (node.kind === "leaf") return above + node.thread;
  const here = above + node.drop;
  return Math.max(depth(node.left, here), depth(node.right, here));
}
export const TREE_DEPTH = depth(ROOT, 0);

// Degrees of tilt per unit of normalised torque, and the most an arm tips.
const GAIN = 46;
const MAX_TILT = 13;

function hangingWeight(
  node: TreeNode,
  removed: ReadonlySet<StickerId>,
): number {
  if (node.kind === "leaf")
    return removed.has(node.sticker.id) ? 0 : node.weight;
  return hangingWeight(node.left, removed) + hangingWeight(node.right, removed);
}

// Where each arm wants to rest with these stickers taken down. The levers
// were cut for the full set, so any missing weight tips its arm toward the
// side still hanging, and the arms above tip to carry the difference.
export function armTargets(removed: ReadonlySet<StickerId>) {
  return ARMS.map((node) => {
    const leftWeight = hangingWeight(node.left, removed);
    const rightWeight = hangingWeight(node.right, removed);
    const leftLever = node.pivot;
    const rightLever = 1 - node.pivot;
    const torque =
      (rightWeight * rightLever - leftWeight * leftLever) / node.weight;
    return Math.max(-MAX_TILT, Math.min(MAX_TILT, torque * GAIN));
  });
}
