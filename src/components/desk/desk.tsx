"use client";

import { useCallback } from "react";
import { RetroView, type StageFactory } from "./retro-view";
import {
  THING_CAPTIONS as CAPTIONS,
  thingName as nameOf,
} from "./thing-captions";
import { THINGS, type ThingId } from "./things-models";

// Things I keep around, as objects on a desk. Hover to read what one is,
// pick it up and drop it, tap it to make it hop. The sentence about each
// one comes from the same copy the sticker line used.

const ROWS = {
  wide: 2,
  narrow: 4,
};

// Equal slots: every thing is scaled into one shared box.
const loadStage = () =>
  import("./retro-stage").then(
    ({ createRetroStage }): StageFactory =>
      (canvas, things, events, options) =>
        createRetroStage(canvas, things, events, {
          ...options,
          rows: ROWS,
          grid: true,
        }),
  );

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
      load={loadStage}
      describe={describe}
      caption={caption}
    />
  );
}
