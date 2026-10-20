# PewPew explainer code

The figures about [PewPew](https://github.com/Stringsaeed/pewpew) run the game's own simulation, not a copy of it.

## What is here

- `vendor/`: files copied verbatim from the pewpew repo at the commit in `vendor/VERSION`, at their upstream paths. This includes the simulation (`src/sim/*` except its test), `levels.ts`, `bot.ts`, `flow.ts`, `frameTiming.ts`, `shell/loop.ts`, `render/camera.ts`, the verifier's golden hashes, and from the explainer `world2d.ts`, `dom.ts`, `code.ts`, `figure.ts`, and every `figures/*.ts` except `hero.ts` and `sound.ts`. Upstream's `src/save.ts`, `src/audio/*`, the rest of `src/render/*`, and those two figures are left out because they need React Native, WebGPU, or the audio engine. The figures are mounted as React islands by `src/components/interactive/pewpew/`.
- `shims/`: local stand-ins the sync script points vendored files at (see `PATCHES`). `save.ts` is the part of upstream's `save.ts` that `flow.ts` and the flow figure use; `data.ts` serves `EXCERPTS` and `GOLDEN` from the JSON below in place of the explainer's build-time `data.ts`; `frames.ts` gives each mounted figure a timer scope, so its `requestAnimationFrame` and `setInterval` calls pause off screen and stop on unmount; `canvas.ts` gives canvas labels the site's mono font and maps pointers on canvases shrunk to fit a phone; `dom-a11y.ts` makes the clickable non-buttons (level fields, hop dots) keyboard-operable buttons. `frames.test.ts` covers the timer scope.
- `excerpts.json`: code excerpts for the figures, with line ranges and GitHub permalinks at the pinned commit.
- `golden.json`: the per-level golden rows from `scripts/verify-levels.golden.txt`.
- `sim.test.ts`: checks that the vendored sim reproduces the golden hash for every level (`bun test src/explainers`).

`vendor/`, `excerpts.json`, and `golden.json` are generated. Do not edit them by hand; your changes are lost on the next sync. To change a vendored file, change it upstream. If it must differ here, add an entry to `PATCHES` in `scripts/sync-pewpew.ts` and say why. Biome does not lint or format `vendor/`.

## Bump the pinned commit

```sh
bun run pewpew:sync <sha-or-branch>   # e.g. main; resolved to a full SHA and written to vendor/VERSION
bun run pewpew:excerpts
bun test src/explainers
bun run check:ts
```

`bun run pewpew:sync` with no argument re-fetches the SHA already in `vendor/VERSION`. The sync fails, and leaves `vendor/` untouched, if any file returns an error or a patch no longer matches.

## Post draft

`post.mdx` is the explainer's prose as a post for this site. `scripts/pewpew-post.ts` generates it from the explainer's `post.md` at the commit in `vendor/VERSION`: figures become `{{pewpew-*}}` slots, `{{code:Name}}` becomes a `ts` fence with a permalink from `excerpts.json`, and endnotes become a final Notes list. The site does not serve this file; it is the source for the Sanity import. Do not edit it by hand.

The generator also makes the prose true of this site rather than of the repo's explainer:

- `proseEdits` in the script is a table of exact-string edits to `post.md`, each with a `why`. Like `PATCHES` in the sync, each must match exactly once or the script fails. They cover the pinned commit (upstream's excerpts follow the code; here they are pinned to `vendor/VERSION` and re-synced on purpose), the hero (the 2D sim view here, not the WebGPU renderer), and the step walkthrough's count (a guard plus ten stages, eleven steps).
- Note markers are joined to the word before them with a non-breaking space, so `[5]` never wraps onto a line of its own.
- `HELD_FIGURES` leaves a figure out of the post and puts a sentence in its place. `pewpew-sound` is held there until the sound figure is ported; its name and registry entry stay. To put it back in the post, delete its line in `HELD_FIGURES` and regenerate.

Captions are not in `post.mdx`. `captions.ts` has the caption for every PewPew figure (upstream's `fig.caption()` text as plain text, reworded only where it describes something this site lacks). `bun run pewpew:import` attaches them to the interactive blocks, and both dev previews read them from the same map. `captions.test.ts` checks that every `pewpew-*` figure has one.

In dev, `/prototypes/pewpew-post` renders this draft as the blog will, with live figures.

```sh
bun run pewpew:post            # downloads post.md at the pinned SHA
bun run pewpew:post path/to/post.md
```

`bun run pewpew:import` writes the draft into Sanity as the draft document `drafts.post-pewpew-source-tour` (project and dataset from `src/sanity/env.ts`). It parses `post.mdx` with the same `parseLocalPost` the site uses, checks every block against the post schema, and uploads with `sanity documents create --replace`, so it uses the Sanity CLI's login. Use it for the draft only, and review and publish from the Studio. (`--publish --yes-publish-live` writes the published id directly; it is there for later and is refused without the confirmation flag.) `--dry-run` builds and validates the document without uploading it.
