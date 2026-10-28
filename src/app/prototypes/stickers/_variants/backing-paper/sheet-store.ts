import { STICKERS } from "@/components/sticker-data";
import type { StickerId } from "./frames";

// Which stickers this reader has peeled, kept across visits so the sheet
// shows where it has been handled. { peeled: { [id]: timestamp } }.
const STORAGE_KEY = "sticker-sheet";
const IDS = new Set<string>(STICKERS.map((sticker) => sticker.id));
const NONE: ReadonlySet<StickerId> = new Set();

let peeled: Record<string, number> | null = null;
let snapshot: ReadonlySet<StickerId> = NONE;
const listeners = new Set<() => void>();

function load() {
  let next: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed.peeled === "object" && parsed.peeled) {
      next = parsed.peeled;
    }
  } catch {
    /* Unreadable or blocked storage: start from a fresh sheet. */
  }
  peeled = next;
  snapshot = new Set(
    Object.keys(next).filter((id): id is StickerId => IDS.has(id)),
  );
}

function save(next: Record<string, number>) {
  peeled = next;
  snapshot = new Set(Object.keys(next) as StickerId[]);
  try {
    if (Object.keys(next).length === 0) localStorage.removeItem(STORAGE_KEY);
    else
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          peeled: next,
        }),
      );
  } catch {
    /* Private mode: the sheet still remembers for this visit. */
  }
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  load();
  for (const listener of listeners) listener();
}

export function subscribePeeled(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getPeeled() {
  if (peeled === null) load();
  return snapshot;
}

// The server and the hydration pass always see a fresh sheet.
export function getServerPeeled() {
  return NONE;
}

export function markPeeled(id: StickerId) {
  if (peeled === null) load();
  if (peeled?.[id]) return;
  save({
    ...peeled,
    [id]: Date.now(),
  });
}

export function resetSheet() {
  save({});
}
