"use client";

import { Dialog } from "@base-ui/react/dialog";
import { RiCloseLine } from "@remixicon/react";
import {
  animate,
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { getImageProps } from "next/image";
import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { BOOKS, type Book, spineColor } from "@/data/books";
import {
  type PulledBookSize,
  pulledBookSize,
  roundSpineStrips,
  REST_ROTATE_X,
  REST_ROTATE_Y,
  rubberBand,
  SHELF_ROTATE_Y,
  shelfTransform,
} from "@/lib/book-geometry";
import { BookSpine } from "./book-spine";

// The pull is a long, rare flight across the screen, so it gets its own
// springs rather than the short UI tiers in lib/springs. Travel and turn run
// on separate springs: the book clears the shelf spine-first, then swings
// round to its cover with a little follow-through.
const PULL_TRAVEL = {
  type: "spring",
  visualDuration: 0.5,
  bounce: 0.16,
} as const;
const PULL_TURN = {
  type: "spring",
  visualDuration: 0.55,
  bounce: 0.26,
  delay: 0.07,
} as const;
// Going back must not overshoot the slot, and the book has to be spine-out
// again before it gets there. The rest thresholds cut the spring's invisible
// tail so the shelf copy takes over as soon as the book is home.
const RETURN_TRAVEL = {
  type: "spring",
  visualDuration: 0.4,
  bounce: 0,
  restDelta: 0.5,
  restSpeed: 4,
} as const;
const RETURN_SCALE = {
  ...RETURN_TRAVEL,
  restDelta: 0.002,
  restSpeed: 0.02,
} as const;
const RETURN_TURN = {
  type: "spring",
  visualDuration: 0.26,
  bounce: 0,
} as const;
const SETTLE = {
  type: "spring",
  visualDuration: 0.4,
  bounce: 0.3,
} as const;
const EASE_OUT = [
  0.23,
  1,
  0.32,
  1,
] as const;

const DRAG_SLOP = 6;
const TURN_PER_PIXEL = 0.45;
const TILT_PER_PIXEL = 0.2;
const TURN_RANGE = [
  -35,
  95,
] as const;
const TILT_RANGE = [
  -28,
  22,
] as const;
const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 600;

const COVER_SIZES = "(max-width: 40rem) 65vw, 320px";

function coverImageProps(book: Book) {
  return getImageProps({
    src: book.cover,
    alt: "",
    width: book.width * 4,
    height: book.height * 4,
    sizes: COVER_SIZES,
    quality: 90,
  }).props;
}

// Covers are fetched and decoded ahead of the tap so the first frames of the
// pull never wait on the network. The elements are kept so the decoded
// bitmaps stay warm.
const warmCovers = new Map<string, HTMLImageElement>();

function warmCover(book: Book) {
  if (warmCovers.has(book.id)) return;

  const { src, srcSet, sizes } = coverImageProps(book);
  const image = new Image();
  image.decoding = "async";
  image.fetchPriority = "low";
  if (sizes) image.sizes = sizes;
  if (srcSet) image.srcset = srcSet;
  image.src = src;
  warmCovers.set(book.id, image);
  image.decode().catch(() => {
    warmCovers.delete(book.id);
  });
}

function viewportSize() {
  const viewport = window.visualViewport;

  return {
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  };
}

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  turn: number;
  tilt: number;
  mode: "pending" | "turn" | "dismiss";
};

// How much shade a spine face takes once it is turned fully away.
const SPINE_SHADE = 0.55;

// Shade for one strip of a rounded spine, from how squarely it faces the
// viewer at the book's current turn. The strips nearest a cover brighten as
// that cover comes round, which is what makes the curve read as a curve.
function StripShade({
  facing,
  rotateY,
}: {
  facing: number;
  rotateY: MotionValue<number>;
}) {
  const opacity = useTransform(
    rotateY,
    (turn) =>
      SPINE_SHADE *
      (1 - Math.max(0, Math.cos(((turn + facing) * Math.PI) / 180))),
  );

  return (
    <motion.div
      className="book-shade"
      style={{
        opacity,
      }}
    />
  );
}

type PulledBookProps = {
  book: Book;
  onRequestClose: () => void;
  onReturned: () => void;
  onTaken: (id: string) => void;
  open: boolean;
  reduceMotion: boolean;
  size: PulledBookSize;
  slot: HTMLElement;
};

function PulledBook({
  book,
  onRequestClose,
  onReturned,
  onTaken,
  open,
  reduceMotion,
  size,
  slot,
}: PulledBookProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const placedRef = useRef(false);
  const gestureRef = useRef<Gesture | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(SHELF_ROTATE_Y);
  const presence = useMotionValue(reduceMotion ? 0 : 1);
  const scrim = useMotionValue(0);
  const detail = useMotionValue(0);

  // Light follows the turn: the cover is in shade while it is edge-on, the
  // spine falls into shade as it swings away, and the cast shadow only shows
  // once the book has left the row.
  const coverShade = useTransform(
    rotateY,
    [
      REST_ROTATE_Y,
      SHELF_ROTATE_Y,
    ],
    [
      0,
      0.42,
    ],
  );
  const spineShade = useTransform(
    rotateY,
    [
      REST_ROTATE_Y,
      SHELF_ROTATE_Y,
    ],
    [
      0.3,
      0,
    ],
  );
  const castShadow = useTransform(
    rotateY,
    [
      62,
      SHELF_ROTATE_Y,
    ],
    [
      1,
      0,
    ],
  );
  const detailY = useTransform(
    detail,
    [
      0,
      1,
    ],
    [
      8,
      0,
    ],
  );

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let cancelled = false;
    const home = () =>
      shelfTransform(
        slot.getBoundingClientRect(),
        stage.getBoundingClientRect(),
        size,
      );

    if (!placedRef.current) {
      placedRef.current = true;
      if (reduceMotion) {
        rotateX.jump(REST_ROTATE_X);
        rotateY.jump(REST_ROTATE_Y);
      } else {
        const from = home();
        x.jump(from.x);
        y.jump(from.y);
        scale.jump(from.scale);
      }
      onTaken(book.id);
    }

    if (open) {
      const controls = reduceMotion
        ? [
            animate(presence, 1, {
              duration: 0.2,
              ease: "easeOut",
            }),
            animate(scrim, 1, {
              duration: 0.2,
              ease: "easeOut",
            }),
            animate(detail, 1, {
              duration: 0.2,
              ease: "easeOut",
            }),
          ]
        : [
            animate(x, 0, PULL_TRAVEL),
            animate(y, 0, PULL_TRAVEL),
            animate(scale, 1, PULL_TRAVEL),
            animate(rotateX, REST_ROTATE_X, PULL_TURN),
            animate(rotateY, REST_ROTATE_Y, PULL_TURN),
            animate(scrim, 1, {
              duration: 0.3,
              ease: EASE_OUT,
            }),
            animate(detail, 1, {
              duration: 0.3,
              ease: EASE_OUT,
              delay: 0.22,
            }),
          ];

      return () => {
        for (const control of controls) control.stop();
      };
    }

    const to = home();
    const controls = reduceMotion
      ? [
          animate(presence, 0, {
            duration: 0.15,
            ease: "easeOut",
          }),
          animate(scrim, 0, {
            duration: 0.15,
            ease: "easeOut",
          }),
          animate(detail, 0, {
            duration: 0.1,
            ease: "easeOut",
          }),
        ]
      : [
          animate(x, to.x, RETURN_TRAVEL),
          animate(y, to.y, RETURN_TRAVEL),
          animate(scale, to.scale, RETURN_SCALE),
          animate(rotateX, 0, RETURN_TURN),
          animate(rotateY, SHELF_ROTATE_Y, RETURN_TURN),
          animate(scrim, 0, {
            duration: 0.25,
            ease: EASE_OUT,
            delay: 0.08,
          }),
          animate(detail, 0, {
            duration: 0.12,
            ease: EASE_OUT,
          }),
        ];

    Promise.all(controls.map((control) => control.finished)).then(() => {
      if (!cancelled) onReturned();
    });

    return () => {
      cancelled = true;
      for (const control of controls) control.stop();
    };
  }, [
    book.id,
    detail,
    onReturned,
    onTaken,
    open,
    presence,
    reduceMotion,
    rotateX,
    rotateY,
    scale,
    scrim,
    size,
    slot,
    x,
    y,
  ]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!open || reduceMotion || event.button !== 0) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      rotateX.stop();
      rotateY.stop();
      gestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        turn: rotateY.get(),
        tilt: rotateX.get(),
        mode: "pending",
      };
    },
    [
      open,
      reduceMotion,
      rotateX,
      rotateY,
    ],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;

      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;

      if (gesture.mode === "pending") {
        if (Math.hypot(dx, dy) < DRAG_SLOP) return;
        // A mostly downward drag puts the book away; anything else turns it.
        gesture.mode = dy > 0 && dy > Math.abs(dx) * 1.2 ? "dismiss" : "turn";
        if (gesture.mode === "dismiss") {
          y.stop();
          scale.stop();
        }
      }

      if (gesture.mode === "turn") {
        rotateY.set(
          rubberBand(gesture.turn + dx * TURN_PER_PIXEL, ...TURN_RANGE),
        );
        rotateX.set(
          rubberBand(gesture.tilt - dy * TILT_PER_PIXEL, ...TILT_RANGE),
        );
        return;
      }

      const pull = Math.max(0, dy);
      y.set(pull);
      scale.set(1 - Math.min(pull / 900, 0.12));
      scrim.set(1 - Math.min(pull / 360, 0.55));
    },
    [
      rotateX,
      rotateY,
      scale,
      scrim,
      y,
    ],
  );

  const handlePointerEnd = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      gestureRef.current = null;

      if (gesture.mode === "dismiss") {
        const released = event.type === "pointerup";
        if (
          released &&
          (y.get() > DISMISS_DISTANCE || y.getVelocity() > DISMISS_VELOCITY)
        ) {
          onRequestClose();
          return;
        }
        animate(y, 0, SETTLE);
        animate(scale, 1, SETTLE);
        animate(scrim, 1, {
          duration: 0.2,
          ease: EASE_OUT,
        });
        return;
      }

      animate(rotateX, REST_ROTATE_X, SETTLE);
      animate(rotateY, REST_ROTATE_Y, SETTLE);
    },
    [
      onRequestClose,
      rotateX,
      rotateY,
      scale,
      scrim,
      y,
    ],
  );

  const cover = coverImageProps(book);

  return (
    <>
      <Dialog.Backdrop
        className="fixed inset-0 z-50 bg-background/94 data-closed:pointer-events-none"
        render={
          <motion.div
            style={{
              opacity: scrim,
            }}
          />
        }
      />
      <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-6 data-closed:pointer-events-none">
        <Dialog.Popup className="flex flex-col items-center outline-none">
          <div
            ref={stageRef}
            className="book-stage"
            style={
              {
                "--book-w": `${size.width}px`,
                "--book-h": `${size.height}px`,
                "--book-d": `${size.depth}px`,
                "--spine-bulge": `${size.spineBulge}px`,
                "--board-thickness": book.board
                  ? `${(book.board / book.height) * size.height}px`
                  : undefined,
                "--pages": book.pages,
                "--board-color": book.coverColor,
                "--spine-color": spineColor(book),
                "--headband": book.headband,
              } as CSSProperties
            }
          >
            {/* The book is a picture of itself; the title and author below
                carry its name for assistive tech. */}
            <motion.div
              aria-hidden="true"
              className="book-mover"
              style={{
                x,
                y,
                scale,
                opacity: presence,
                perspective: `${size.perspective}px`,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
            >
              <motion.div
                className="book"
                data-binding={book.binding}
                data-round={size.spineBulge > 0 ? "" : undefined}
                style={{
                  rotateX,
                  rotateY,
                }}
              >
                <motion.div
                  className="book-cast-shadow"
                  style={{
                    opacity: castShadow,
                  }}
                />
                <div
                  className="book-face book-back"
                  style={{
                    background: book.coverColor,
                  }}
                />
                <div className="book-face book-lining book-lining-back" />
                <div className="book-face book-lining book-lining-front" />
                <div className="book-face book-lining book-lining-spine" />
                <div className="book-face book-pages book-fore" />
                <div className="book-face book-pages book-top" />
                <div className="book-face book-pages book-bottom" />
                <div className="book-face book-boards book-fore-boards" />
                <div className="book-face book-boards book-top-boards" />
                <div className="book-face book-boards book-bottom-boards" />
                {size.spineBulge > 0 ? (
                  <>
                    {roundSpineStrips(size).map((strip) => (
                      <div
                        key={strip.key}
                        className="book-face book-spine-strip"
                        style={{
                          left: `calc(50% - ${strip.width / 2}px)`,
                          width: strip.width,
                          transform: `translate3d(${strip.x}px, 0, ${strip.z}px) rotateY(${strip.rotateY}deg)`,
                        }}
                      >
                        <div
                          className="book-spine-slice"
                          style={{
                            width: size.depth,
                            transform: `translateX(${strip.sliceOffset}px) scaleX(${strip.sliceScale})`,
                          }}
                        >
                          <BookSpine book={book} unlit />
                        </div>
                        <StripShade facing={strip.rotateY} rotateY={rotateY} />
                      </div>
                    ))}
                    <div className="book-face book-spine-cap book-spine-cap-top" />
                    <div className="book-face book-spine-cap book-spine-cap-bottom" />
                  </>
                ) : (
                  <div className="book-face book-spine-face">
                    <BookSpine book={book} />
                    <motion.div
                      className="book-shade"
                      style={{
                        opacity: spineShade,
                      }}
                    />
                  </div>
                )}
                <div
                  className="book-face book-front"
                  style={{
                    background: book.coverColor,
                  }}
                >
                  {/* biome-ignore lint/performance/noImgElement: getImageProps keeps this cover on the same optimized URL that warmCover preloaded. */}
                  <img
                    {...cover}
                    alt=""
                    loading="eager"
                    draggable={false}
                    className="book-cover"
                  />
                  <motion.div
                    className="book-shade"
                    style={{
                      opacity: coverShade,
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            className="max-w-72 text-center"
            style={{
              // Perspective pushes the near corner below the stage; clear it.
              marginTop: size.height * 0.08 + 28,
              opacity: detail,
              y: detailY,
            }}
          >
            <Dialog.Title className="text-base leading-6 font-semibold tracking-tight text-balance">
              {book.title}
            </Dialog.Title>
            <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
              {book.author}
            </Dialog.Description>
          </motion.div>

          <Dialog.Close
            aria-label="Put the book back"
            className="fixed top-4 right-4 inline-flex size-10 items-center justify-center rounded-full bg-accent text-foreground transition-colors hover:bg-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            render={
              <motion.button
                style={{
                  opacity: detail,
                }}
              />
            }
          >
            <RiCloseLine aria-hidden="true" className="size-5" />
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Viewport>
    </>
  );
}

type PulledState = {
  book: Book;
  size: PulledBookSize;
  slot: HTMLElement;
};

export function BookShelf() {
  const shelfRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<Dialog.Root.Actions>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const [pulled, setPulled] = useState<PulledState | null>(null);
  // Set once the pulled book is standing in the slot, so the shelf copy only
  // disappears when its stand-in is already painted over it.
  const [takenId, setTakenId] = useState<string | null>(null);

  useEffect(() => {
    const shelf = shelfRef.current;
    if (!shelf) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setRevealed(true);
        for (const book of BOOKS) warmCover(book);
      },
      {
        rootMargin: "160px 0px",
      },
    );
    observer.observe(shelf);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;

    const resize = () => {
      setPulled((current) =>
        current
          ? {
              ...current,
              size: pulledBookSize(current.book, viewportSize()),
            }
          : null,
      );
    };
    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, [
    open,
  ]);

  const pull = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const slot = event.currentTarget;
    const book = BOOKS.find((candidate) => candidate.id === slot.dataset.book);
    if (!book) return;

    setPulled({
      book,
      size: pulledBookSize(book, viewportSize()),
      slot,
    });
    setOpen(true);
  }, []);

  const handleReturned = useCallback(() => {
    setPulled(null);
    setTakenId(null);
    actionsRef.current?.unmount();
  }, []);

  // Motion drives the return flight, which Base UI can't see, so every close
  // has to hold the dialog mounted until handleReturned releases it.
  const handleOpenChange = useCallback(
    (nextOpen: boolean, details: Dialog.Root.ChangeEventDetails) => {
      if (!nextOpen) details.preventUnmountOnClose();
      setOpen(nextOpen);
    },
    [],
  );

  const handleRequestClose = useCallback(() => {
    actionsRef.current?.close();
  }, []);

  return (
    <div
      ref={shelfRef}
      className="bookshelf"
      data-revealed={revealed || undefined}
    >
      <ul className="bookshelf-row">
        {BOOKS.map((book, index) => (
          <li key={book.id}>
            <button
              type="button"
              className="shelf-book"
              aria-haspopup="dialog"
              aria-label={`${book.title} by ${book.author}`}
              data-book={book.id}
              data-taken={takenId === book.id || undefined}
              data-analytics-event="Book Opened"
              data-analytics-label={book.title}
              data-analytics-location="Home"
              style={
                {
                  "--book-d": book.depth,
                  "--book-h": book.height,
                  "--book-index": index,
                } as CSSProperties
              }
              onClick={pull}
            >
              <BookSpine book={book} />
            </button>
          </li>
        ))}
      </ul>
      <div aria-hidden className="bookshelf-board" />

      <Dialog.Root
        open={open}
        onOpenChange={handleOpenChange}
        actionsRef={actionsRef}
      >
        <Dialog.Portal>
          {pulled ? (
            <PulledBook
              key={pulled.book.id}
              book={pulled.book}
              onRequestClose={handleRequestClose}
              onReturned={handleReturned}
              onTaken={setTakenId}
              open={open}
              reduceMotion={reduceMotion}
              size={pulled.size}
              slot={pulled.slot}
            />
          ) : null}
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
