"use client";

import { useCallback } from "react";
import { CLAUSES } from "@/components/things-copy";
import { RetroView } from "./retro-view";
import { THINGS, type ThingId } from "./things-models";

// Things I keep around, as objects on a desk. Hover to read what one is,
// pick it up and drop it, tap it to make it hop. The sentence about each
// one comes from the same copy the sticker line used.

const CAPTIONS = new Map<ThingId, string>(
  CLAUSES.map((clause) => {
    const rest = clause.rest
      .map((token) => (typeof token === "string" ? token : token.word))
      .join("");
    const sentence = `${clause.lead}${rest}`.replace(/[,.]\s*$/, "");
    return [
      clause.id,
      `${sentence[0].toUpperCase()}${sentence.slice(1)}.`,
    ];
  }),
);

const ROWS = {
  wide: 2,
  narrow: 4,
};

// Places along the back, things you pick up along the front. A narrow
// window keeps this order and wraps it into two columns.
const ORDER: ThingId[] = [
  "pyramids",
  "burj",
  "monstera",
  "babylon",
  "bass",
  "keyboard",
  "controller",
  "pencil",
];

const ON_DESK = ORDER.map((id) => {
  const found = THINGS.find((thing) => thing.id === id);
  if (!found) throw new Error(`Missing desk thing: ${id}`);
  return found;
});

const nameOf = (id: ThingId) =>
  THINGS.find((thing) => thing.id === id)?.name ?? id;

export function Desk() {
  const describe = useCallback(
    (id: ThingId) => `${nameOf(id)}. ${CAPTIONS.get(id) ?? ""}`,
    [],
  );
  const caption = useCallback((id: ThingId | null) => {
    if (!id) return <span>Things I keep around. Pick one up.</span>;
    return (
      <>
        <strong>{nameOf(id)}</strong>
        <span>{CAPTIONS.get(id)}</span>
      </>
    );
  }, []);
  return (
    <RetroView
      things={ON_DESK}
      label="Things I keep around"
      rows={ROWS}
      grid
      describe={describe}
      caption={caption}
    />
  );
}
