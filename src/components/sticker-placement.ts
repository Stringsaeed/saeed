import { STICKERS, type StickerDefinition } from "./sticker-data";
import type { SavedStickers } from "./sticker-storage";

type Rectangle = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type StickerPlacement = StickerDefinition & {
  left: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  top: number;
  rotation: number;
};

export type FieldGeometry = {
  height: number;
  protectedRectangles: Rectangle[];
  width: number;
};

const MINIMUM_VIEWPORT_WIDTH = 960;
const EDGE_PADDING = 24;
const CONTENT_CLEARANCE = 18;
const STICKER_CLEARANCE = 22;
const PLACEMENT_ATTEMPTS = 80;
function createRandom(seed: number) {
  let value = seed;

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(random: () => number, minimum: number, maximum: number) {
  return minimum + random() * (maximum - minimum);
}

function rotatedSize(width: number, height: number, degrees: number) {
  const radians = (Math.abs(degrees) * Math.PI) / 180;

  return {
    width:
      Math.abs(width * Math.cos(radians)) +
      Math.abs(height * Math.sin(radians)),
    height:
      Math.abs(width * Math.sin(radians)) +
      Math.abs(height * Math.cos(radians)),
  };
}

function rectanglesOverlap(first: Rectangle, second: Rectangle, clearance = 0) {
  return !(
    first.right + clearance <= second.left ||
    first.left >= second.right + clearance ||
    first.bottom + clearance <= second.top ||
    first.top >= second.bottom + clearance
  );
}

function getScale(viewportWidth: number) {
  if (viewportWidth < 1120) return 0.7;
  if (viewportWidth < 1360) return 0.85;
  return 1;
}

export function getFieldGeometry(field: HTMLElement): FieldGeometry {
  const fieldRect = field.getBoundingClientRect();

  return {
    height: fieldRect.height,
    protectedRectangles: Array.from(
      document.querySelectorAll<HTMLElement>("[data-sticker-protected]"),
    ).map((element) => {
      const rect = element.getBoundingClientRect();

      return {
        left: rect.left - fieldRect.left,
        top: rect.top - fieldRect.top,
        right: rect.right - fieldRect.left,
        bottom: rect.bottom - fieldRect.top,
      };
    }),
    width: fieldRect.width,
  };
}

function getStickerRectangle(sticker: StickerPlacement): Rectangle {
  const bounds = rotatedSize(
    sticker.width * sticker.scale,
    sticker.height * sticker.scale,
    sticker.rotation,
  );
  const centerX = sticker.left + sticker.offsetX + sticker.width / 2;
  const centerY = sticker.top + sticker.offsetY + sticker.height / 2;

  return {
    left: centerX - bounds.width / 2,
    top: centerY - bounds.height / 2,
    right: centerX + bounds.width / 2,
    bottom: centerY + bounds.height / 2,
  };
}

export function coversProtectedContent(
  candidate: StickerPlacement,
  geometry: FieldGeometry,
) {
  const rectangle = getStickerRectangle(candidate);
  return geometry.protectedRectangles.some((protectedRectangle) =>
    rectanglesOverlap(rectangle, protectedRectangle, CONTENT_CLEARANCE),
  );
}

export function isPlacementValid(
  candidate: StickerPlacement,
  placements: StickerPlacement[],
  geometry: FieldGeometry,
  allowContentOverlap = false,
) {
  const rectangle = getStickerRectangle(candidate);
  const staysInField =
    rectangle.left >= EDGE_PADDING &&
    rectangle.top >= EDGE_PADDING &&
    rectangle.right <= geometry.width - EDGE_PADDING &&
    rectangle.bottom <= geometry.height - EDGE_PADDING;
  if (!staysInField) return false;

  if (!allowContentOverlap && coversProtectedContent(candidate, geometry)) {
    return false;
  }

  return placements.every(
    (sticker) =>
      sticker.id === candidate.id ||
      !rectanglesOverlap(
        rectangle,
        getStickerRectangle(sticker),
        STICKER_CLEARANCE,
      ),
  );
}

export function moveSticker(
  placements: StickerPlacement[],
  id: StickerPlacement["id"],
  offsetX: number,
  offsetY: number,
  geometry: FieldGeometry,
  allowContentOverlap = false,
) {
  const index = placements.findIndex((sticker) => sticker.id === id);
  const current = placements[index];
  if (!current) return placements;

  let next = current;
  const horizontal = {
    ...next,
    offsetX,
  };
  if (isPlacementValid(horizontal, placements, geometry, allowContentOverlap)) {
    next = horizontal;
  }

  const vertical = {
    ...next,
    offsetY,
  };
  if (isPlacementValid(vertical, placements, geometry, allowContentOverlap)) {
    next = vertical;
  }

  if (next === current) return placements;

  return placements.map((sticker, stickerIndex) =>
    stickerIndex === index ? next : sticker,
  );
}

const SNAP_CLEARANCE_EPSILON = 0.5;

function withStickerOffset(
  placements: StickerPlacement[],
  index: number,
  sticker: StickerPlacement,
) {
  return placements.map((item, stickerIndex) =>
    stickerIndex === index ? sticker : item,
  );
}

function nearestAxisExits(sticker: StickerPlacement, geometry: FieldGeometry) {
  const rectangle = getStickerRectangle(sticker);
  const hits = geometry.protectedRectangles.filter((protectedRectangle) =>
    rectanglesOverlap(rectangle, protectedRectangle, CONTENT_CLEARANCE),
  );
  let left = 0;
  let right = 0;
  let up = 0;
  let down = 0;

  for (const hit of hits) {
    left = Math.max(left, rectangle.right + CONTENT_CLEARANCE - hit.left);
    right = Math.max(right, hit.right + CONTENT_CLEARANCE - rectangle.left);
    up = Math.max(up, rectangle.bottom + CONTENT_CLEARANCE - hit.top);
    down = Math.max(down, hit.bottom + CONTENT_CLEARANCE - rectangle.top);
  }

  return [
    {
      x: -(left + SNAP_CLEARANCE_EPSILON),
      y: 0,
    },
    {
      x: right + SNAP_CLEARANCE_EPSILON,
      y: 0,
    },
    {
      x: 0,
      y: -(up + SNAP_CLEARANCE_EPSILON),
    },
    {
      x: 0,
      y: down + SNAP_CLEARANCE_EPSILON,
    },
  ].sort(
    (first, second) =>
      Math.hypot(first.x, first.y) - Math.hypot(second.x, second.y),
  );
}

export function snapStickerToNearestSafe(
  placements: StickerPlacement[],
  id: StickerPlacement["id"],
  geometry: FieldGeometry,
) {
  const index = placements.findIndex((sticker) => sticker.id === id);
  const current = placements[index];
  if (!current || !coversProtectedContent(current, geometry)) return placements;

  for (const translation of nearestAxisExits(current, geometry)) {
    const candidate = {
      ...current,
      offsetX: current.offsetX + translation.x,
      offsetY: current.offsetY + translation.y,
    };
    if (isPlacementValid(candidate, placements, geometry)) {
      return withStickerOffset(placements, index, candidate);
    }
  }

  const limit = Math.max(geometry.width, geometry.height);
  for (let radius = 8; radius <= limit; radius += 8) {
    let nearest: StickerPlacement | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let step = 0; step < 24; step += 1) {
      const angle = (step / 24) * Math.PI * 2;
      const candidate = {
        ...current,
        offsetX: current.offsetX + Math.cos(angle) * radius,
        offsetY: current.offsetY + Math.sin(angle) * radius,
      };
      if (!isPlacementValid(candidate, placements, geometry)) continue;

      const distance = Math.hypot(
        candidate.offsetX - current.offsetX,
        candidate.offsetY - current.offsetY,
      );
      if (distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }

    if (nearest) return withStickerOffset(placements, index, nearest);
  }

  const home = {
    ...current,
    offsetX: 0,
    offsetY: 0,
  };
  if (isPlacementValid(home, placements, geometry)) {
    return withStickerOffset(placements, index, home);
  }

  return placements;
}

export function transformSticker(
  placements: StickerPlacement[],
  id: StickerPlacement["id"],
  scale: number,
  rotation: number,
  geometry: FieldGeometry,
) {
  const index = placements.findIndex((sticker) => sticker.id === id);
  const current = placements[index];
  if (!current) return placements;

  const transformed = {
    ...current,
    scale,
    rotation,
  };
  if (isPlacementValid(transformed, placements, geometry)) {
    return placements.map((sticker, stickerIndex) =>
      stickerIndex === index ? transformed : sticker,
    );
  }

  let next = current;
  const scaled = {
    ...next,
    scale,
  };
  if (isPlacementValid(scaled, placements, geometry)) next = scaled;

  const rotated = {
    ...next,
    rotation,
  };
  if (isPlacementValid(rotated, placements, geometry)) next = rotated;

  if (next === current) return placements;

  return placements.map((sticker, stickerIndex) =>
    stickerIndex === index ? next : sticker,
  );
}

function restoreSavedStickers(geometry: FieldGeometry, saved: SavedStickers) {
  const viewportScale = getScale(geometry.width);
  const restored: StickerPlacement[] = [];

  for (const sticker of STICKERS) {
    const position = saved[sticker.id];
    if (!position) continue;

    const width = sticker.width * viewportScale;
    const height = sticker.height * viewportScale;
    const candidate: StickerPlacement = {
      ...sticker,
      width,
      height,
      left: geometry.width / 2 + position.x - width / 2,
      offsetX: 0,
      offsetY: 0,
      scale: position.scale,
      top: position.y - height / 2,
      rotation: position.rotation,
    };

    // A saved spot that no longer fits (narrower window, shifted content)
    // is skipped, not deleted, so it comes back when the room does.
    if (isPlacementValid(candidate, restored, geometry)) {
      restored.push(candidate);
    }
  }

  return restored;
}

export function placeStickers(
  geometry: FieldGeometry,
  seed: number,
  saved: SavedStickers = {},
) {
  if (geometry.width < MINIMUM_VIEWPORT_WIDTH) return [];

  if (geometry.protectedRectangles.length === 0) return [];

  const protectedColumn = geometry.protectedRectangles.reduce(
    (column, rectangle) => ({
      left: Math.min(column.left, rectangle.left),
      top: Math.min(column.top, rectangle.top),
      right: Math.max(column.right, rectangle.right),
      bottom: Math.max(column.bottom, rectangle.bottom),
    }),
  );

  const scale = getScale(geometry.width);
  const random = createRandom(seed);
  const occupied: Rectangle[] = [];
  const placements: StickerPlacement[] = [];
  const firstStickerStartsOnLeft = random() < 0.5;
  const restored = new Map(
    restoreSavedStickers(geometry, saved).map((sticker) => [
      sticker.id,
      sticker,
    ]),
  );

  for (const sticker of restored.values()) {
    occupied.push(getStickerRectangle(sticker));
  }

  for (const [index, sticker] of STICKERS.entries()) {
    const restoredSticker = restored.get(sticker.id);
    if (restoredSticker) {
      placements.push(restoredSticker);
      continue;
    }

    const width = sticker.width * scale;
    const height = sticker.height * scale;
    const rotation = randomBetween(random, -15, 15);
    const bounds = rotatedSize(width, height, rotation);
    const leftRegion = {
      minimum: EDGE_PADDING,
      maximum: protectedColumn.left - CONTENT_CLEARANCE - bounds.width,
    };
    const rightRegion = {
      minimum: protectedColumn.right + CONTENT_CLEARANCE,
      maximum: geometry.width - EDGE_PADDING - bounds.width,
    };
    const prefersLeft =
      index % 2 === 0 ? firstStickerStartsOnLeft : !firstStickerStartsOnLeft;
    const regions = prefersLeft
      ? [
          leftRegion,
          rightRegion,
        ]
      : [
          rightRegion,
          leftRegion,
        ];
    let placement: StickerPlacement | undefined;

    for (const region of regions) {
      if (region.maximum < region.minimum) continue;

      for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt += 1) {
        const maximumTop = geometry.height - EDGE_PADDING - bounds.height;
        if (maximumTop < EDGE_PADDING) break;

        const left = randomBetween(random, region.minimum, region.maximum);
        const top = randomBetween(random, EDGE_PADDING, maximumTop);
        const rectangle = {
          left,
          top,
          right: left + bounds.width,
          bottom: top + bounds.height,
        };
        const coversContent = geometry.protectedRectangles.some(
          (protectedRectangle) =>
            rectanglesOverlap(rectangle, protectedRectangle, CONTENT_CLEARANCE),
        );
        const coversSticker = occupied.some((occupiedRectangle) =>
          rectanglesOverlap(rectangle, occupiedRectangle, STICKER_CLEARANCE),
        );

        if (coversContent || coversSticker) continue;

        occupied.push(rectangle);
        placement = {
          ...sticker,
          width,
          height,
          left: left + (bounds.width - width) / 2,
          offsetX: 0,
          offsetY: 0,
          scale: 1,
          top: top + (bounds.height - height) / 2,
          rotation,
        };
        break;
      }

      if (placement) break;
    }

    if (placement) placements.push(placement);
  }

  return placements;
}
