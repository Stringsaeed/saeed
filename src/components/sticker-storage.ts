import { STICKERS, type StickerDefinition } from "./sticker-data";

// A sticker's centre, stored relative to the horizontal middle of the field
// (so it stays beside the page column at any viewport width) and the top of
// the field in pixels.
export type SavedSticker = {
  rotation: number;
  scale: number;
  x: number;
  y: number;
};

export type SavedStickers = Partial<
  Record<StickerDefinition["id"], SavedSticker>
>;

const STORAGE_KEY = "saeed:sticker-positions:v1";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseSavedSticker(value: unknown): SavedSticker | null {
  if (typeof value !== "object" || value === null) return null;
  const { rotation, scale, x, y } = value as Record<string, unknown>;
  if (
    !isFiniteNumber(rotation) ||
    !isFiniteNumber(scale) ||
    !isFiniteNumber(x) ||
    !isFiniteNumber(y) ||
    scale <= 0
  ) {
    return null;
  }

  return {
    rotation,
    scale,
    x,
    y,
  };
}

export function loadSavedStickers(): SavedStickers {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    const saved: SavedStickers = {};
    for (const { id } of STICKERS) {
      const sticker = parseSavedSticker(
        (parsed as Record<string, unknown>)[id],
      );
      if (sticker) saved[id] = sticker;
    }
    return saved;
  } catch {
    return {};
  }
}

export function persistSavedStickers(saved: SavedStickers) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage can be full or blocked (private mode); positions just won't stick.
  }
}
