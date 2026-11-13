import { CLAUSES } from "@/components/things-copy";
import { THINGS, type ThingId } from "./things-models";

// One line about each thing, made from the same copy the sticker sentence
// used: the clause, whole, as its own sentence.

export const THING_CAPTIONS = new Map<ThingId, string>(
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

export const thingName = (id: ThingId) =>
  THINGS.find((thing) => thing.id === id)?.name ?? id;
