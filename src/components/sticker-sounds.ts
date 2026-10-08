import { playDefinition } from "@/lib/sound";
import { STICKERS, type StickerDefinition } from "./sticker-data";

export function playStickerSound(id: StickerDefinition["id"]) {
  const sticker = STICKERS.find((candidate) => candidate.id === id);
  if (sticker?.sound) playDefinition(`sticker:${id}`, sticker.sound);
}
