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
  width: number;
  height: number;
};

export const STICKERS: StickerDefinition[] = [
  {
    id: "pyramids",
    label: "Giza pyramids",
    src: "/stickers/pyramids.png",
    width: 240,
    height: 135,
  },
  {
    id: "burj",
    label: "Burj Khalifa",
    src: "/stickers/burj-khalifa.png",
    width: 80,
    height: 218,
  },
  {
    id: "bass",
    label: "Bass guitar",
    src: "/stickers/bass.png",
    width: 160,
    height: 191,
  },
  {
    id: "keyboard",
    label: "Keyboard",
    src: "/stickers/lofree-block.png",
    width: 240,
    height: 160,
  },
  {
    id: "controller",
    label: "PlayStation",
    src: "/stickers/controller.png",
    width: 240,
    height: 160,
  },
  {
    id: "monstera",
    label: "Monstera",
    src: "/stickers/monstera.png",
    width: 184,
    height: 184,
  },
  {
    id: "pencil",
    label: "Uni pencil",
    src: "/stickers/uni-pencil.png",
    width: 170,
    height: 142,
  },
  {
    id: "babylon",
    label: "Babylon perfume",
    src: "/stickers/babylon.png",
    width: 120,
    height: 180,
  },
];
