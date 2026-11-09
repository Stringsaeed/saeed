import { STICKERS, type StickerDefinition } from "@/components/sticker-data";

// The eight things from the home-page sentence, each with the story behind
// it. Copy moved here from docs/things-stories.md so the Things app can show
// them.
export type Thing = StickerDefinition & {
  slug: string;
  title: string;
  caption: string;
  story: readonly string[];
};

const stories: Record<
  StickerDefinition["id"],
  Pick<Thing, "slug" | "title" | "caption" | "story">
> = {
  pyramids: {
    slug: "pyramids",
    title: "The pyramids",
    caption: "I grew up beside them.",
    story: [
      "Growing up beside the pyramids gave me a little more pride in who I am. Knowing you're walking on the same land that built such a civilisation is something else. Egypt hasn't had an easy decade and a half, but some things can't die in us. We're good, generous, very funny people, and we welcome you like family.",
      "Being raised beside the longest river in the world made me proud of where I was born, too. No one can take my identity or my love for this country. I can't fit all my feelings in one place, and I'm sure a lot of people have already said it better.",
    ],
  },
  burj: {
    slug: "burj-khalifa",
    title: "Burj Khalifa",
    caption: "Where I live now.",
    story: [
      "My aunt moved to Dubai thirty years ago, and my cousins were born and raised there. Every time they visited Egypt they told me about everything they'd seen. Long before the Burj Khalifa, Dubai and the UAE had a place in my heart.",
      "Emirati people are the most wholesome people on earth: caring, loving, and warm. They greet you as you walk down the street, and most of what they say is a prayer for you. I've never felt as safe anywhere as I have in the UAE. This is my second home, and I'll always be grateful for this place and these people.",
    ],
  },
  bass: {
    slug: "bass",
    title: "Bass guitar",
    caption: "I listen for it first.",
    story: [
      "I started noticing bass in 2013. Someone was playing and I thought they weren't doing anything. Then I listened properly and realised bass is what makes a song move. Arctic Monkeys' bass lines are what actually hooked me.",
    ],
  },
  keyboard: {
    slug: "keyboard",
    title: "Mechanical keyboard",
    caption: "Because I'm a 90s kid.",
    story: [
      "I'm a 90s kid. Computers showed up early, and the keyboards were mechanical. That's why I still use one. It feels nostalgic, and the sound still gets me going.",
    ],
  },
  controller: {
    slug: "playstation",
    title: "PlayStation",
    caption: "Since Winning Eleven.",
    story: [
      "I've played PlayStation since the first one. We used to go to the end of the street to play Winning Eleven 3. We called it japanese, يابانية. The Konami code still lives in my head.",
      "After COVID I bought a PS4. Last birthday my wife got me a PS5.",
    ],
  },
  monstera: {
    slug: "monstera",
    title: "Two monsteras",
    caption: "Watered every morning.",
    story: [
      "I have a monkey monstera and a Thai one at home. They grow like crazy. Seeing them in the morning is a boost.",
    ],
  },
  pencil: {
    slug: "pencil",
    title: "Uni pencil",
    caption: "It reminds me of my father.",
    story: [
      "My father always carried a Uni pen. When my sister and I started high school, he bought each of us a rOtring mechanical pencil to help us study. We had to keep them clean and always have them with us. Of course, I lost mine somewhere.",
      "When I saw this Uni pencil, I had to buy it. I loved the design, but more than that, it reminded me of my father. May God rest his soul.",
    ],
  },
  babylon: {
    slug: "babylon",
    title: "Babylon perfume",
    caption: "Earthy and woody.",
    story: [
      "I like earthy and woody notes, and I couldn't resist this one. I love leaving a woody, earthy impression when I walk in or walk out. It's too good.",
    ],
  },
};

export const things: readonly Thing[] = STICKERS.map((sticker) => ({
  ...sticker,
  ...stories[sticker.id],
}));

export function findThing(slug: string) {
  return things.find((thing) => thing.slug === slug) ?? null;
}
