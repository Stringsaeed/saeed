import { defineSound } from "@web-kits/audio";
import { playDefinition } from "@/lib/sound";
import { STICKERS, type StickerDefinition } from "./sticker-data";

const players = new Map(
  STICKERS.map((sticker) => [
    sticker.id,
    defineSound(sticker.sound),
  ]),
);

export function playStickerSound(id: StickerDefinition["id"]) {
  const play = players.get(id);
  if (play) playDefinition(`sticker:${id}`, play);
}
