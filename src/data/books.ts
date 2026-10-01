// The Stripe Press house spine: author at the head, title centred, press
// mark at the foot. Measurements are in spine units along a length of 1600,
// taken from the publisher's own spine so the type lands where it does in
// print.
export type StripePressSpine = {
  design: "stripe-press";
  thickness: number;
  background: string;
  color: string;
  texture: "paper" | "cloth";
  // Foil-stamped type sits slightly into the board.
  stamped?: boolean;
  author: {
    text: string;
    start: number;
    length: number;
    size: number;
    weight: number;
  };
  title: {
    text: string;
    center: number;
    length: number;
    size: number;
    weight: number;
  };
  mark: {
    start: number;
    length: number;
  };
};

// A spine redrawn from the printed book, one drawing per title.
export type DrawnSpine = {
  design: "inspired" | "everyday-things" | "staff-engineers-path";
};

// The printed spine itself, cut from the publisher's cover wrap.
export type ImageSpine = {
  design: "image";
  src: string;
  // Pixel size of the artwork, thickness by length.
  width: number;
  height: number;
  background: string;
  texture?: "cloth";
};

export type BookSpineDesign = StripePressSpine | DrawnSpine | ImageSpine;

export type Book = {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  cover: string;
  // Placeholder behind the cover image and the colour of the back board.
  coverColor: string;
  // Hardcovers get boards that overhang a recessed page block.
  binding: "hardcover" | "paperback";
  // A rounded back: the share of the spine's thickness taken by the curve
  // that carries it round into each cover. Omit for a square back.
  spineRound?: number;
  // Colour of the headband stitched across the head and foot of the page block.
  headband?: string;
  // Trim size in shelf units: cover width, cover height, spine thickness.
  // Width follows the cover image's aspect ratio so the art is never cropped;
  // depth follows the real spine's proportions.
  width: number;
  height: number;
  depth: number;
  spine: BookSpineDesign;
};

// Stripe Press prints its list at one trim size, so those three share a
// height and a cover width and differ only in thickness.
export const BOOKS: readonly Book[] = [
  {
    id: "the-design-of-everyday-things",
    title: "The Design of Everyday Things",
    subtitle: "Revised and Expanded Edition",
    author: "Don Norman",
    cover: "/books/the-design-of-everyday-things.jpg",
    coverColor: "#ffe136",
    binding: "paperback",
    width: 127,
    height: 190,
    depth: 18.7,
    spine: {
      design: "everyday-things",
    },
  },
  {
    id: "inspired",
    title: "Inspired",
    subtitle: "How to Create Tech Products Customers Love",
    author: "Marty Cagan",
    cover: "/books/inspired-second-edition.jpg",
    coverColor: "#ffffff",
    binding: "hardcover",
    spineRound: 0.34,
    width: 140,
    height: 208,
    depth: 25,
    spine: {
      design: "inspired",
    },
  },
  {
    id: "the-staff-engineers-path",
    title: "The Staff Engineer’s Path",
    subtitle:
      "A Guide for Individual Contributors Navigating Growth and Change",
    author: "Tanya Reilly",
    cover: "/books/the-staff-engineers-path.jpg",
    coverColor: "#f2f3f5",
    binding: "paperback",
    width: 136,
    height: 204,
    depth: 16.5,
    spine: {
      design: "staff-engineers-path",
    },
  },
  {
    id: "scaling-people",
    title: "Scaling People",
    subtitle: "Tactics for Management and Company Building",
    author: "Claire Hughes Johnson",
    cover: "/books/scaling-people.jpg",
    coverColor: "#97734d",
    binding: "hardcover",
    headband: "#3552dc",
    width: 145.8,
    height: 212,
    depth: 27.6,
    spine: {
      design: "image",
      src: "/books/scaling-people-spine.jpg",
      width: 166,
      height: 1277,
      background: "#99724b",
    },
  },
  {
    id: "an-elegant-puzzle",
    title: "An Elegant Puzzle",
    subtitle: "Systems of Engineering Management",
    author: "Will Larson",
    cover: "/books/an-elegant-puzzle.jpg",
    coverColor: "#ffffff",
    binding: "hardcover",
    width: 145.8,
    height: 212,
    depth: 28.8,
    spine: {
      design: "stripe-press",
      thickness: 217.5,
      background: "#e3e4e2",
      color: "#262626",
      texture: "cloth",
      author: {
        text: "Will Larson",
        start: 112,
        length: 150,
        size: 29.5,
        weight: 600,
      },
      title: {
        text: "An Elegant Puzzle — Systems of Engineering Management",
        center: 800,
        length: 791,
        size: 29.5,
        weight: 600,
      },
      mark: {
        start: 1396,
        length: 86,
      },
    },
  },
  {
    id: "where-is-my-flying-car",
    title: "Where Is My Flying Car?",
    author: "J. Storrs Hall",
    cover: "/books/where-is-my-flying-car-front.jpg",
    coverColor: "#00baf2",
    binding: "hardcover",
    headband: "#41b0e4",
    width: 145.8,
    height: 212,
    depth: 22.9,
    spine: {
      design: "image",
      src: "/books/where-is-my-flying-car-spine.png",
      width: 138,
      height: 1277,
      background: "#787777",
      texture: "cloth",
    },
  },
];

// Colour of the spine board where it shows at the head and foot of the book.
export function spineColor(book: Book) {
  if (book.spine.design === "stripe-press" || book.spine.design === "image") {
    return book.spine.background;
  }
  return book.coverColor;
}
