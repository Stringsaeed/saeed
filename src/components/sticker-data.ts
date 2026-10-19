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
  src: string;
  story: string;
  width: number;
  height: number;
};

export const STICKERS: StickerDefinition[] = [
  {
    id: "pyramids",
    label: "Giza pyramids",
    src: "/stickers/pyramids.png",
    story:
      "Growing up beside the pyramids gave me a little more pride in who I am. I'm very proud of who I am and what I am. Knowing you're walking on the same land that built such a civilization is something else. I know Egypt hasn't been good for the last decade and a half, but some things can't die in us. We're good, generous, very, very funny people, and we welcome you like family.\n\nBeing raised beside the longest river in the world made me proud of where I was born, too. Like I said, Egypt isn't the best place on earth to live, but no one can steal my identity or my love for this country. I can't fit all my feelings in one place, and I'm sure a lot of people have already said it.",
    width: 240,
    height: 135,
  },
  {
    id: "burj",
    label: "Burj Khalifa",
    src: "/stickers/burj-khalifa.png",
    story:
      "My aunt moved to Dubai 30 years ago, and my cousins were born and raised there. Every time they visited Egypt, they told me about everything they'd experienced. Long before the Burj Khalifa, Dubai and the UAE always had a place in my heart. Emirati people are the most wholesome people on earth: caring, loving, and warm. They greet you even as you walk down the street, and most of what they say is a prayer for you. I can't describe how much I love Emirati people. Beyond that, I've never felt as safe anywhere as I have in the UAE. You could literally leave millions of dollars in a public place and no one would go near them. Here you feel a kind of safety the rest of the world can't even describe. This is my second home, and I'll always be grateful for this place and these people.",
    width: 80,
    height: 218,
  },
  {
    id: "bass",
    label: "Bass guitar",
    src: "/stickers/bass.png",
    story:
      "I started noticing bass in 2013. Someone was playing and I thought they weren't doing anything. Then I listened properly and realized bass is what makes a song move. Arctic Monkeys' bass lines are what actually hooked me.",
    width: 160,
    height: 191,
  },
  {
    id: "keyboard",
    label: "Keyboard",
    src: "/stickers/lofree-block.png",
    story:
      "I'm a 90s kid. Computers showed up early, and the keyboards were mechanical. That's why I still use one. It feels nostalgic, and the sound still gets me going.",
    width: 240,
    height: 160,
  },
  {
    id: "controller",
    label: "PlayStation",
    src: "/stickers/controller.png",
    story:
      "I've played PlayStation since the first one. We used to go to the end of the street to play Winning Eleven 3. We called it japanese, يابانية. The Konami code still lives in my head. After covid I bought a PS4. Last birthday my wife got me a PS5.",
    width: 240,
    height: 160,
  },
  {
    id: "monstera",
    label: "Monstera",
    src: "/stickers/monstera.png",
    story:
      "I have a monkey monstera and a Thai one at home. They grow like crazy. Seeing them in the morning is a boost.",
    width: 184,
    height: 184,
  },
  {
    id: "pencil",
    label: "Uni pencil",
    src: "/stickers/uni-pencil.png",
    story:
      "The story is simple. My father always carried a Uni pen. When my sister and I started high school, he bought each of us a rOtring mechanical pencil to help us study. We had to keep them clean and always have them with us. Of course, I lost mine somewhere. When I saw this Uni pencil, I had to buy it. I loved the design, but more than that, it reminded me of my father. May God rest his soul.",
    width: 170,
    height: 142,
  },
  {
    id: "babylon",
    label: "Babylon perfume",
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
