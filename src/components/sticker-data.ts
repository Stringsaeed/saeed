import type { SoundName } from "cuelume";

export type StickerDefinition = {
  id: "bass" | "controller" | "keyboard" | "monstera" | "pencil";
  label: string;
  sound: SoundName;
  src: string;
  story: string;
  width: number;
  height: number;
};

export const STICKERS: StickerDefinition[] = [
  {
    id: "keyboard",
    label: "Keyboard",
    sound: "toggle",
    src: "/stickers/lofree-block.png",
    story:
      "I'm a 90s kid. Computers showed up early, and the keyboards were mechanical. That's why I still use one. It feels nostalgic, and the sound still gets me going.",
    width: 240,
    height: 160,
  },
  {
    id: "monstera",
    label: "Monstera",
    sound: "bloom",
    src: "/stickers/monstera.png",
    story:
      "I have a monkey monstera and a Thai one at home. They grow like crazy. Seeing them in the morning is a boost.",
    width: 184,
    height: 184,
  },
  {
    id: "bass",
    label: "Bass guitar",
    sound: "pulse",
    src: "/stickers/bass.png",
    story:
      "I started noticing bass in 2013. Someone was playing and I thought they weren't doing anything. Then I listened properly and realized bass is what makes a song move. Arctic Monkeys' bass lines are what actually hooked me.",
    width: 160,
    height: 191,
  },
  {
    id: "controller",
    label: "PlayStation",
    sound: "scan",
    src: "/stickers/controller.png",
    story:
      "I've played PlayStation since the first one. We used to go to the end of the street to play Winning Eleven 3. We called it japanese, يابانية. The Konami code still lives in my head. After covid I bought a PS4. Last birthday my wife got me a PS5.",
    width: 240,
    height: 160,
  },
  {
    id: "pencil",
    label: "Uni pencil",
    sound: "tick",
    src: "/stickers/uni-pencil.png",
    story:
      "The story is simple. My father always carried a Uni pen. When my sister and I started high school, he bought each of us a rOtring mechanical pencil to help us study. We had to keep them clean and always have them with us. Of course, I lost mine somewhere. When I saw this Uni pencil, I had to buy it. I loved the design, but more than that, it reminded me of my father. May God rest his soul.",
    width: 170,
    height: 142,
  },
];
