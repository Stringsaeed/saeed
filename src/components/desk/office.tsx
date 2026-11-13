"use client";

import { useCallback } from "react";
import styles from "./desk.module.css";
import { CATS, type CatId } from "./office-cats";
import { FIXTURES, type FixtureId, PROPS, type PropId } from "./office-models";
import { RetroView, type StageFactory } from "./retro-view";
import { THING_CAPTIONS, thingName } from "./thing-captions";
import { THINGS, type ThingId } from "./things-models";

// My office, drawn the way a 1997 console would, and seen from inside it:
// drag to look around, tap the floor or use the keys to walk. The things I
// keep around are where they would be. Pick one up and it comes to you, let
// go and it hops back. The lamp, the computer and the chair do what they
// do, the projector shows a film, and Sono and Bosha come and go.

type OfficeId = ThingId | FixtureId | PropId | CatId;

// Three CSS pixels to a texel, like the shelf of cartridges.
const PIXEL_SIZE = 3;

const loadStage = () =>
  import("./office-stage").then(
    ({ createOfficeStage }): StageFactory =>
      (canvas, things, events, options) =>
        createOfficeStage(canvas, things, events, options),
  );

// Draft lines for everything that is not one of the eight things, in the
// voice of the things copy.
const EXTRA_CAPTIONS: Record<FixtureId | PropId | CatId, string> = {
  computer: "Where the apps get built. Tap to switch it off.",
  lamp: "On most nights. Tap to switch it.",
  chair: "It spins. Tap it.",
  projector: "Films are the other thing. Tap to roll one.",
  clapper: "Tap it and the film starts.",
  popcorn: "For the director.",
  orange: "The orange one. Walks the room and loafs where he likes.",
  tuxedo: "The tuxedo. Sleeps on the flower cushion, mostly.",
};

const EXTRAS = [
  ...PROPS,
  ...FIXTURES,
  ...CATS,
];

// Reading order: around the room from the window to the rug.
const ORDER: ThingId[] = [
  "monstera",
  "bass",
  "babylon",
  "keyboard",
  "pencil",
  "pyramids",
  "burj",
  "controller",
];

const IN_OFFICE = [
  ...ORDER.map((id) => {
    const found = THINGS.find((thing) => thing.id === id);
    if (!found) throw new Error(`Missing office thing: ${id}`);
    return found;
  }),
  ...EXTRAS,
];

const isExtra = (id: OfficeId): id is FixtureId | PropId | CatId =>
  id in EXTRA_CAPTIONS;

const nameOf = (id: OfficeId) =>
  isExtra(id)
    ? (EXTRAS.find((extra) => extra.id === id)?.name ?? id)
    : thingName(id);

const captionOf = (id: OfficeId) =>
  isExtra(id) ? EXTRA_CAPTIONS[id] : (THING_CAPTIONS.get(id) ?? "");

export function Office() {
  const describe = useCallback(
    (id: OfficeId) => `${nameOf(id)}. ${captionOf(id)}`,
    [],
  );
  const caption = useCallback((id: OfficeId | null) => {
    if (!id) {
      return (
        <span>
          My office. Drag to look around, tap the floor to walk, pick things up.
        </span>
      );
    }
    return (
      <>
        <strong>{nameOf(id)}</strong>
        <span>{captionOf(id)}</span>
      </>
    );
  }, []);
  return (
    <RetroView<OfficeId>
      things={IN_OFFICE}
      label="My office, and the things I keep in it"
      load={loadStage}
      pixelSize={PIXEL_SIZE}
      describe={describe}
      caption={caption}
      className={`${styles.office} ${styles.scene}`}
      stageClassName={styles.view}
    />
  );
}
