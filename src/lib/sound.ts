import type { defineSound, SoundDefinition } from "@web-kits/audio";

// Every interface sound on the site. They stay short and quiet: the ones that
// fire on hover or on every tap sit well under the stickers and books, which
// are the moments meant to be heard.
const definitions = {
  // A soft, crisp click for links and buttons.
  tap: {
    layers: [
      {
        source: {
          type: "noise",
          color: "white",
        },
        filter: {
          type: "bandpass",
          frequency: 3800,
          resonance: 2,
        },
        envelope: {
          decay: 0.006,
        },
        gain: 0.12,
      },
      {
        source: {
          type: "sine",
          frequency: {
            start: 2200,
            end: 1400,
          },
        },
        envelope: {
          decay: 0.012,
        },
        gain: 0.05,
      },
    ],
  },
  // A barely-there tick as the pointer settles on something.
  hover: {
    layers: [
      {
        source: {
          type: "sine",
          frequency: 1900,
        },
        envelope: {
          decay: 0.008,
        },
        gain: 0.025,
      },
      {
        source: {
          type: "noise",
          color: "white",
        },
        filter: {
          type: "highpass",
          frequency: 6000,
        },
        envelope: {
          decay: 0.003,
        },
        gain: 0.02,
      },
    ],
  },
  // A fingernail on a hardback: one dry paper snap with a tiny board knock.
  bookTap: {
    layers: [
      {
        source: {
          type: "noise",
          color: "white",
        },
        filter: {
          type: "bandpass",
          frequency: 4200,
          resonance: 2.5,
        },
        envelope: {
          decay: 0.004,
        },
        gain: 0.24,
      },
      {
        source: {
          type: "triangle",
          frequency: {
            start: 700,
            end: 420,
          },
        },
        envelope: {
          decay: 0.01,
        },
        gain: 0.08,
      },
    ],
  },
  // Two quick ticks: the book leaving its slot, then the cover flicking open.
  bookOpen: {
    layers: [
      {
        source: {
          type: "noise",
          color: "white",
        },
        filter: {
          type: "bandpass",
          frequency: 3400,
          resonance: 2.5,
        },
        envelope: {
          decay: 0.005,
        },
        gain: 0.2,
      },
      {
        source: {
          type: "noise",
          color: "white",
        },
        filter: {
          type: "bandpass",
          frequency: 5600,
          resonance: 3,
        },
        envelope: {
          decay: 0.004,
        },
        gain: 0.18,
        delay: 0.045,
      },
      {
        source: {
          type: "sine",
          frequency: {
            start: 1500,
            end: 1100,
          },
        },
        envelope: {
          decay: 0.008,
        },
        gain: 0.05,
        delay: 0.045,
      },
    ],
  },
  // The spine knocking back into its slot: one firm, short click.
  bookClose: {
    layers: [
      {
        source: {
          type: "noise",
          color: "white",
        },
        filter: {
          type: "bandpass",
          frequency: 2600,
          resonance: 2,
        },
        envelope: {
          decay: 0.005,
        },
        gain: 0.2,
      },
      {
        source: {
          type: "triangle",
          frequency: {
            start: 340,
            end: 180,
          },
        },
        envelope: {
          decay: 0.018,
        },
        gain: 0.14,
      },
    ],
  },
  // A small upward pop for a menu opening.
  menuOpen: {
    source: {
      type: "sine",
      frequency: {
        start: 520,
        end: 920,
      },
    },
    envelope: {
      attack: 0.004,
      decay: 0.05,
    },
    gain: 0.06,
  },
  // Two light notes confirming a choice.
  select: {
    layers: [
      {
        source: {
          type: "sine",
          frequency: 1175,
        },
        envelope: {
          decay: 0.04,
        },
        gain: 0.05,
      },
      {
        source: {
          type: "sine",
          frequency: 1760,
        },
        envelope: {
          decay: 0.06,
        },
        gain: 0.05,
        delay: 0.035,
      },
    ],
  },
  // A short descending run for the CV landing in downloads.
  download: {
    layers: [
      {
        source: {
          type: "sine",
          frequency: 1319,
        },
        envelope: {
          decay: 0.05,
        },
        gain: 0.05,
      },
      {
        source: {
          type: "sine",
          frequency: 988,
        },
        envelope: {
          decay: 0.05,
        },
        gain: 0.05,
        delay: 0.05,
      },
      {
        source: {
          type: "sine",
          frequency: 659,
        },
        envelope: {
          decay: 0.1,
        },
        gain: 0.06,
        delay: 0.1,
      },
    ],
  },
  soundOn: {
    layers: [
      {
        source: {
          type: "sine",
          frequency: 660,
        },
        envelope: {
          decay: 0.08,
        },
        gain: 0.08,
      },
      {
        source: {
          type: "sine",
          frequency: 990,
        },
        envelope: {
          decay: 0.14,
        },
        gain: 0.08,
        delay: 0.07,
      },
    ],
  },
  soundOff: {
    layers: [
      {
        source: {
          type: "sine",
          frequency: 660,
        },
        envelope: {
          decay: 0.08,
        },
        gain: 0.07,
      },
      {
        source: {
          type: "sine",
          frequency: 440,
        },
        envelope: {
          decay: 0.12,
        },
        gain: 0.07,
        delay: 0.07,
      },
    ],
  },
} satisfies Record<string, SoundDefinition>;

export type SoundName = keyof typeof definitions;

type Player = ReturnType<typeof defineSound>;

// The synth engine isn't needed to paint anything, so it loads once the page
// settles (see SiteSounds) instead of shipping with the first bundle.
let define: typeof defineSound | null = null;
let engine: Promise<void> | null = null;
const players = new Map<SoundDefinition, Player>();

export function loadSoundEngine() {
  engine ??= import("@web-kits/audio").then((module) => {
    define = module.defineSound;
  });
  return engine;
}

// A cue asked for before the engine arrives still plays if it can land close
// enough to the gesture to read as its sound; otherwise it is dropped.
const LATE_CUE_MS = 120;

function withPlayer(
  definition: SoundDefinition,
  play: (player: Player) => void,
) {
  const ready = () => {
    let player = players.get(definition);
    if (!player) {
      player = (define as typeof defineSound)(definition);
      players.set(definition, player);
    }
    play(player);
  };

  if (define) {
    ready();
    return;
  }

  const requested = performance.now();
  void loadSoundEngine().then(() => {
    if (performance.now() - requested <= LATE_CUE_MS) ready();
  });
}

// The same cue can't restart faster than this, so a burst of events (a quick
// sweep across the shelf, a double click) plays once instead of stuttering.
const MIN_GAP_MS = 45;
const HOVER_GAP_MS = 90;
const lastPlayed = new Map<string, number>();

function throttled(key: string, gap: number) {
  const now = performance.now();
  if (now - (lastPlayed.get(key) ?? -Infinity) < gap) return true;
  lastPlayed.set(key, now);
  return false;
}

const STORAGE_KEY = "sound-enabled";
const listeners = new Set<() => void>();
let enabled: boolean | null = null;

export function isSoundEnabled() {
  if (enabled === null) {
    try {
      enabled = localStorage.getItem(STORAGE_KEY) !== "false";
    } catch {
      enabled = true;
    }
  }
  return enabled;
}

export function setSoundEnabled(next: boolean) {
  // The off cue has to play before the switch flips, the on cue after.
  if (!next) withPlayer(definitions.soundOff, (play) => play());
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    /* Private mode: the choice still holds for this visit. */
  }
  if (next) withPlayer(definitions.soundOn, (play) => play());
  for (const listener of listeners) listener();
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Plays a cue unless sound is off or the same cue just played. */
export function playSound(name: SoundName) {
  if (!isSoundEnabled() || throttled(name, MIN_GAP_MS)) return;
  withPlayer(definitions[name], (play) =>
    play({
      jitter: {
        detune: 20,
        volume: 0.06,
      },
    }),
  );
}

/** Hover cues share one throttle so sweeping across a row can't rattle. */
export function playHoverSound(name: SoundName) {
  if (!isSoundEnabled() || throttled("hover", HOVER_GAP_MS)) return;
  playSound(name);
}

/** Plays any definition (the stickers bring their own) behind the same gate. */
export function playDefinition(key: string, definition: SoundDefinition) {
  if (!isSoundEnabled() || throttled(key, MIN_GAP_MS)) return;
  withPlayer(definition, (play) =>
    play({
      jitter: {
        detune: 25,
        volume: 0.08,
      },
    }),
  );
}

export function isSoundName(name: string | undefined): name is SoundName {
  return name !== undefined && name in definitions;
}
