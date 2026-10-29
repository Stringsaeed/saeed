# Sticker desk prototypes

Directions kept for later, behind the picker at `/prototypes/stickers` (dev
server only; production answers 404). Paperweights and Long Take are the
shipped desks (`src/components/`), split by the `sticker-desk` PostHog
experiment; Mobile lives here.

The October 2026 reimagining round added four directions that leave the
pile-and-modal shape behind. Each is an `inline` variant (see `types.ts`):
a section inside the home column, no pile, no page lock.

- `questions/` — Ask me a better question. Questions lead, the stickers arrive
  as answers, with two related questions after each story.
- `rebus/` — Rebus. A one-word "Things" heading over a bio paragraph in which
  the stickers stand in for eight nouns. No stories here (those belong in a
  blog post); hovering a sticker scales it up. Copy lives in `copy.ts`.
- `portrait/` — A portrait in three objects. A place, a rhythm, and something
  kept close compose one of eighteen hand-placed impossible-scale portraits.
- `backing-paper/` — Backing Paper. A die-cut sticker sheet; peel a sticker and
  its story is printed on the liner it covered. Read state persists locally.

`?v=<n>` picks a variant by its one-based position in `registry.ts`.
