import type { SoundDefinition } from "@web-kits/audio";

export type StickerDefinition = {
  id:
    | "babylon"
    | "bass"
    | "burj"
    | "controller"
    | "keyboard"
    | "monstera"
    | "pencil"
    | "pyramids";
  label: string;
  sound: SoundDefinition;
  src: string;
  story: string;
  width: number;
  height: number;
};

export const STICKERS: StickerDefinition[] = [
  {
    id: "pyramids",
    label: "Giza pyramids",
    sound: {
      // A gust of desert wind carrying a short Hijaz phrase: the flat second
      // leaning on the tonic, the sound of a Cairo afternoon.
      layers: [
        {
          source: {
            type: "noise",
            color: "pink",
          },
          filter: {
            type: "bandpass",
            frequency: 500,
            resonance: 0.7,
            envelope: {
              attack: 0.12,
              peak: 1400,
              decay: 0.3,
            },
          },
          envelope: {
            attack: 0.1,
            decay: 0.35,
          },
          gain: 0.12,
        },
        {
          source: {
            type: "triangle",
            frequency: 311,
          },
          filter: {
            type: "lowpass",
            frequency: 2200,
          },
          envelope: {
            attack: 0.004,
            decay: 0.16,
          },
          gain: 0.16,
          delay: 0.05,
        },
        {
          source: {
            type: "triangle",
            frequency: 294,
          },
          filter: {
            type: "lowpass",
            frequency: 2200,
          },
          envelope: {
            attack: 0.004,
            decay: 0.4,
          },
          gain: 0.18,
          delay: 0.17,
        },
      ],
      effects: [
        {
          type: "reverb",
          decay: 1.2,
          damping: 0.5,
          mix: 0.3,
        },
      ],
    },
    src: "/stickers/pyramids.png",
    story:
      "Growing up beside the pyramids gave me a little more pride in who I am. I'm very proud of who I am and what I am. Knowing you're walking on the same land that built such a civilization is something else. I know Egypt hasn't been good for the last decade and a half, but some things can't die in us. We're good, generous, very, very funny people, and we welcome you like family.\n\nBeing raised beside the longest river in the world made me proud of where I was born, too. Like I said, Egypt isn't the best place on earth to live, but no one can steal my identity or my love for this country. I can't fit all my feelings in one place, and I'm sure a lot of people have already said it.",
    width: 240,
    height: 135,
  },
  {
    id: "burj",
    label: "Burj Khalifa",
    sound: {
      // The express elevator arriving at the top: a soft two-tone chime.
      layers: [
        {
          source: {
            type: "sine",
            frequency: 1047,
          },
          envelope: {
            attack: 0.002,
            decay: 0.5,
          },
          gain: 0.14,
        },
        {
          source: {
            type: "sine",
            frequency: 2094,
          },
          envelope: {
            attack: 0.002,
            decay: 0.18,
          },
          gain: 0.04,
        },
        {
          source: {
            type: "sine",
            frequency: 1319,
          },
          envelope: {
            attack: 0.002,
            decay: 0.7,
          },
          gain: 0.14,
          delay: 0.16,
        },
        {
          source: {
            type: "sine",
            frequency: 2638,
          },
          envelope: {
            attack: 0.002,
            decay: 0.22,
          },
          gain: 0.035,
          delay: 0.16,
        },
      ],
      effects: [
        {
          type: "reverb",
          decay: 1,
          damping: 0.3,
          mix: 0.25,
        },
      ],
    },
    src: "/stickers/burj-khalifa.png",
    story:
      "My aunt moved to Dubai 30 years ago, and my cousins were born and raised there. Every time they visited Egypt, they told me about everything they'd experienced. Long before the Burj Khalifa, Dubai and the UAE always had a place in my heart. Emirati people are the most wholesome people on earth: caring, loving, and warm. They greet you even as you walk down the street, and most of what they say is a prayer for you. I can't describe how much I love Emirati people. Beyond that, I've never felt as safe anywhere as I have in the UAE. You could literally leave millions of dollars in a public place and no one would go near them. Here you feel a kind of safety the rest of the world can't even describe. This is my second home, and I'll always be grateful for this place and these people.",
    width: 80,
    height: 218,
  },
  {
    id: "bass",
    label: "Bass guitar",
    sound: {
      // A fingerstyle pluck on the open E string.
      layers: [
        {
          source: {
            type: "sawtooth",
            frequency: 82.4,
          },
          filter: {
            type: "lowpass",
            frequency: 320,
            resonance: 2,
            envelope: {
              peak: 1500,
              decay: 0.22,
            },
          },
          envelope: {
            attack: 0.003,
            decay: 0.5,
          },
          gain: 0.34,
        },
        {
          source: {
            type: "sine",
            frequency: 164.8,
          },
          envelope: {
            attack: 0.003,
            decay: 0.32,
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
            frequency: 900,
            resonance: 1.5,
          },
          envelope: {
            decay: 0.01,
          },
          gain: 0.12,
        },
      ],
      effects: [
        {
          type: "distortion",
          amount: 6,
          mix: 0.2,
        },
      ],
    },
    src: "/stickers/bass.png",
    story:
      "I started noticing bass in 2013. Someone was playing and I thought they weren't doing anything. Then I listened properly and realized bass is what makes a song move. Arctic Monkeys' bass lines are what actually hooked me.",
    width: 160,
    height: 191,
  },
  {
    id: "keyboard",
    label: "Keyboard",
    sound: {
      // A tactile mechanical switch: the leaf click, the keycap bottoming out
      // on the plate with a hollow thock, then the lighter clack on the way up.
      layers: [
        {
          source: {
            type: "noise",
            color: "white",
          },
          filter: {
            type: "bandpass",
            frequency: 5200,
            resonance: 3,
          },
          envelope: {
            decay: 0.006,
          },
          gain: 0.28,
        },
        {
          source: {
            type: "noise",
            color: "white",
          },
          filter: {
            type: "bandpass",
            frequency: 1700,
            resonance: 1.3,
          },
          envelope: {
            attack: 0.001,
            decay: 0.028,
          },
          gain: 0.42,
          delay: 0.007,
        },
        {
          source: {
            type: "sine",
            frequency: {
              start: 430,
              end: 250,
            },
          },
          envelope: {
            attack: 0.001,
            decay: 0.035,
          },
          gain: 0.26,
          delay: 0.007,
        },
        {
          source: {
            type: "triangle",
            frequency: 170,
          },
          envelope: {
            attack: 0.002,
            decay: 0.045,
          },
          gain: 0.1,
          delay: 0.007,
        },
        {
          source: {
            type: "noise",
            color: "white",
          },
          filter: {
            type: "bandpass",
            frequency: 2400,
            resonance: 1.5,
          },
          envelope: {
            decay: 0.016,
          },
          gain: 0.2,
          delay: 0.095,
        },
        {
          source: {
            type: "sine",
            frequency: {
              start: 560,
              end: 400,
            },
          },
          envelope: {
            decay: 0.018,
          },
          gain: 0.08,
          delay: 0.095,
        },
      ],
    },
    src: "/stickers/lofree-block.png",
    story:
      "I'm a 90s kid. Computers showed up early, and the keyboards were mechanical. That's why I still use one. It feels nostalgic, and the sound still gets me going.",
    width: 240,
    height: 160,
  },
  {
    id: "controller",
    label: "PlayStation",
    sound: {
      // A two-note menu confirm, straight out of the PS1 era.
      layers: [
        {
          source: {
            type: "square",
            frequency: 988,
          },
          filter: {
            type: "lowpass",
            frequency: 4000,
          },
          envelope: {
            decay: 0.07,
          },
          gain: 0.1,
        },
        {
          source: {
            type: "square",
            frequency: 1319,
          },
          filter: {
            type: "lowpass",
            frequency: 4000,
          },
          envelope: {
            decay: 0.16,
          },
          gain: 0.1,
          delay: 0.07,
        },
      ],
      effects: [
        {
          type: "bitcrusher",
          bits: 6,
          mix: 0.4,
        },
      ],
    },
    src: "/stickers/controller.png",
    story:
      "I've played PlayStation since the first one. We used to go to the end of the street to play Winning Eleven 3. We called it japanese, يابانية. The Konami code still lives in my head. After covid I bought a PS4. Last birthday my wife got me a PS5.",
    width: 240,
    height: 160,
  },
  {
    id: "monstera",
    label: "Monstera",
    sound: {
      // Leaves rustling open into a bright morning fifth.
      layers: [
        {
          source: {
            type: "noise",
            color: "pink",
          },
          filter: {
            type: "bandpass",
            frequency: 900,
            resonance: 0.8,
            envelope: {
              attack: 0.04,
              peak: 3200,
              decay: 0.16,
            },
          },
          envelope: {
            attack: 0.02,
            decay: 0.18,
          },
          gain: 0.14,
        },
        {
          source: {
            type: "sine",
            frequency: {
              start: 523,
              end: 659,
            },
          },
          envelope: {
            attack: 0.02,
            decay: 0.32,
          },
          gain: 0.12,
        },
        {
          source: {
            type: "sine",
            frequency: {
              start: 784,
              end: 988,
            },
          },
          envelope: {
            attack: 0.02,
            decay: 0.38,
          },
          gain: 0.08,
          delay: 0.07,
        },
      ],
      effects: [
        {
          type: "reverb",
          decay: 0.9,
          damping: 0.4,
          mix: 0.25,
        },
      ],
    },
    src: "/stickers/monstera.png",
    story:
      "I have a monkey monstera and a Thai one at home. They grow like crazy. Seeing them in the morning is a boost.",
    width: 184,
    height: 184,
  },
  {
    id: "pencil",
    label: "Uni pencil",
    sound: {
      // The cap clicking down to advance the lead, then springing back.
      layers: [
        {
          source: {
            type: "noise",
            color: "white",
          },
          filter: {
            type: "bandpass",
            frequency: 4800,
            resonance: 4,
          },
          envelope: {
            decay: 0.006,
          },
          gain: 0.34,
        },
        {
          source: {
            type: "sine",
            frequency: 3300,
          },
          envelope: {
            decay: 0.012,
          },
          gain: 0.07,
        },
        {
          source: {
            type: "noise",
            color: "white",
          },
          filter: {
            type: "bandpass",
            frequency: 6200,
            resonance: 4,
          },
          envelope: {
            decay: 0.005,
          },
          gain: 0.22,
          delay: 0.075,
        },
        {
          source: {
            type: "sine",
            frequency: 3900,
          },
          envelope: {
            decay: 0.01,
          },
          gain: 0.05,
          delay: 0.075,
        },
      ],
    },
    src: "/stickers/uni-pencil.png",
    story:
      "The story is simple. My father always carried a Uni pen. When my sister and I started high school, he bought each of us a rOtring mechanical pencil to help us study. We had to keep them clean and always have them with us. Of course, I lost mine somewhere. When I saw this Uni pencil, I had to buy it. I loved the design, but more than that, it reminded me of my father. May God rest his soul.",
    width: 170,
    height: 142,
  },
  {
    id: "babylon",
    label: "Babylon perfume",
    sound: {
      // One spritz: the pump clicks down, a crisp tsst of mist that cuts off
      // when the finger lets go, and the pump clicking back up.
      layers: [
        {
          source: {
            type: "noise",
            color: "white",
          },
          filter: {
            type: "bandpass",
            frequency: 2200,
            resonance: 3,
          },
          envelope: {
            decay: 0.006,
          },
          gain: 0.14,
        },
        {
          source: {
            type: "noise",
            color: "white",
          },
          filter: [
            {
              type: "highpass",
              frequency: 6500,
            },
            {
              type: "lowpass",
              frequency: 12000,
            },
          ],
          envelope: {
            attack: 0.003,
            decay: 0.09,
            sustain: 0.7,
            release: 0.03,
          },
          gain: 0.14,
          delay: 0.006,
        },
        {
          source: {
            type: "noise",
            color: "pink",
          },
          filter: {
            type: "bandpass",
            frequency: 8000,
            resonance: 1,
          },
          envelope: {
            attack: 0.003,
            decay: 0.11,
            sustain: 0.6,
            release: 0.03,
          },
          gain: 0.06,
          delay: 0.006,
        },
        {
          source: {
            type: "noise",
            color: "white",
          },
          filter: {
            type: "bandpass",
            frequency: 3000,
            resonance: 3,
          },
          envelope: {
            decay: 0.005,
          },
          gain: 0.08,
          delay: 0.13,
        },
      ],
    },
    src: "/stickers/babylon.png",
    story:
      "I like earthy and woody notes, and I couldn't resist this one. I love leaving a woody, earthy impression when I walk in or walk out. It's too good.",
    width: 120,
    height: 180,
  },
];

export function stickerTransitionName(id: StickerDefinition["id"]) {
  return `sticker-${id}`;
}
