"use client";

import { Dialog } from "@base-ui/react/dialog";
import { RiCloseLine } from "@remixicon/react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
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
import { BOOKS, type Book } from "@/data/books";
import { BOOK_MODELS } from "@/data/books-3d";
import {
  type PulledBookSize,
  pulledBookSize,
  REST_ROTATE_X,
  REST_ROTATE_Y,
  rubberBand,
  SHELF_ROTATE_Y,
  shelfTransform,
} from "@/lib/book-geometry";
import type { BookModel } from "@/lib/books-3d/types";
import type { BookLibrary } from "@/lib/books-3d/viewer";
import { BookSpine } from "./book-spine";
import { BookModelView } from "./books-3d/book-model-view";

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
  -185,
  185,
] as const;
const TILT_RANGE = [
  -28,
  22,
] as const;
const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 600;

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

type PulledBookProps = {
  book: Book;
  model: BookModel;
  getLibrary: () => Promise<BookLibrary>;
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
  model,
  getLibrary,
  onRequestClose,
  onReturned,
  onTaken,
  open,
  reduceMotion,
  size,
  slot,
}: PulledBookProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const handleModelReady = useCallback(() => setReady(true), []);
  const placedRef = useRef(false);
  const gestureRef = useRef<Gesture | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(SHELF_ROTATE_Y);
  const presence = useMotionValue(0);
  const scrim = useMotionValue(0);
  const detail = useMotionValue(0);

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
    if (!ready) {
      if (!open) onReturned();
      return;
    }

    let cancelled = false;
    const home = () =>
      shelfTransform(
        slot.getBoundingClientRect(),
        stage.getBoundingClientRect(),
        size,
      );

    if (!placedRef.current) {
      placedRef.current = true;
      if (!reduceMotion) presence.jump(1);
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
    ready,
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
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
            >
              <BookModelView
                model={model}
                getLibrary={getLibrary}
                fallback={book.cover}
                width={size.width}
                height={size.height}
                perspective={size.perspective}
                rotateX={rotateX}
                rotateY={rotateY}
                onReady={handleModelReady}
              />
            </motion.div>
          </div>

          {!ready && open && (
            <p role="status" className="text-sm text-muted-foreground">
              Loading book…
            </p>
          )}
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
  model: BookModel;
  size: PulledBookSize;
  slot: HTMLElement;
};

export function BookShelf() {
  const library = useRef<Promise<BookLibrary> | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const getLibrary = useCallback(() => {
    if (!library.current) {
      library.current = import("@/lib/books-3d/viewer").then(
        ({ createBookLibrary }) => createBookLibrary(BOOK_MODELS),
      );
      const request = library.current;
      request.catch(() => {
        if (library.current === request) library.current = null;
      });
    }
    return library.current;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const warm = () => {
      void getLibrary()
        .then((instance) => {
          if (cancelled) return;
          return instance.warm((id, preview) => {
            if (!cancelled)
              setPreviews((current) => ({
                ...current,
                [id]: preview,
              }));
          });
        })
        .catch(() => {
          /* The shelf and dialog retain their accessible fallbacks. */
        });
    };
    const schedule = () => {
      if ("requestIdleCallback" in window)
        idle = window.requestIdleCallback(warm, {
          timeout: 1500,
        });
      else timer = setTimeout(warm, 100);
    };
    if (document.readyState === "complete") schedule();
    else
      window.addEventListener("load", schedule, {
        once: true,
      });
    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
      const pending = library.current;
      library.current = null;
      void pending?.then((instance) => instance.dispose()).catch(() => {});
    };
  }, [
    getLibrary,
  ]);
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
              size: pulledBookSize(current.model.dimensionsMm, viewportSize()),
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
    const model = BOOK_MODELS.find((candidate) => candidate.id === book?.id);
    if (!book || !model) return;

    setPulled({
      book,
      model,
      size: pulledBookSize(model.dimensionsMm, viewportSize()),
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
        {BOOKS.map((book, index) => {
          const dimensions = BOOK_MODELS.find(
            (model) => model.id === book.id,
          )?.dimensionsMm;
          const depth = dimensions
            ? (book.height * dimensions.depth) / dimensions.height
            : book.depth;
          return (
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
                    "--book-d": depth,
                    "--book-h": book.height,
                    "--book-index": index,
                  } as CSSProperties
                }
                onClick={pull}
              >
                {previews[book.id] ? (
                  // biome-ignore lint/performance/noImgElement: locally rendered model snapshot, not a remote image.
                  <img
                    src={previews[book.id]}
                    alt=""
                    draggable={false}
                    className="shelf-model-preview"
                    data-model-preview={book.id}
                  />
                ) : (
                  <BookSpine book={book} />
                )}
              </button>
            </li>
          );
        })}
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
              model={pulled.model}
              getLibrary={getLibrary}
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
