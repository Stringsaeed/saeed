"use client";

import dynamic from "next/dynamic";
import {
  type CSSProperties,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { BOOKS } from "@/data/books";
import { BOOK_MODELS } from "@/data/books-3d";
import { pulledBookSize } from "@/lib/book-geometry";
import type { BookLibrary } from "@/lib/books-3d/viewer";
import { onIdle } from "@/lib/idle";
import { playSound } from "@/lib/sound";
import { BookSpine } from "./book-spine";
import type { PulledState } from "./pulled-book-dialog";

const loadPulledBookDialog = () => import("./pulled-book-dialog");

// Motion, the dialog, and the 3D view only matter once a book leaves the
// shelf, so they load after the page settles (or on first intent).
const PulledBookDialog = dynamic(
  () => loadPulledBookDialog().then((module) => module.PulledBookDialog),
  {
    ssr: false,
  },
);

function viewportSize() {
  const viewport = window.visualViewport;

  return {
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  };
}

export function BookShelf() {
  const library = useRef<Promise<BookLibrary> | null>(null);
  const getLibrary = useCallback(() => {
    if (!library.current) {
      library.current = import("@/lib/books-3d/viewer").then(
        ({ createBookLibrary }) => createBookLibrary(),
      );
      const request = library.current;
      request.catch(() => {
        if (library.current === request) library.current = null;
      });
    }
    return library.current;
  }, []);

  useEffect(() => {
    return () => {
      const pending = library.current;
      library.current = null;
      void pending?.then((instance) => instance.dispose()).catch(() => {});
    };
  }, []);
  const shelfRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [showArt, setShowArt] = useState(false);
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

    // Spine art is a few large images; fetch it a screen ahead of the shelf
    // rather than alongside everything above the fold.
    const artObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        artObserver.disconnect();
        setShowArt(true);
      },
      {
        rootMargin: "100% 0px",
      },
    );
    artObserver.observe(shelf);

    return () => {
      observer.disconnect();
      artObserver.disconnect();
    };
  }, []);

  useEffect(() => onIdle(loadPulledBookDialog), []);

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

    playSound("bookOpen");
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
                data-sound="bookTap"
                data-sound-hover="hover"
                style={
                  {
                    "--book-d": depth,
                    "--book-h": book.height,
                    "--book-index": index,
                  } as CSSProperties
                }
                onClick={pull}
                onFocus={loadPulledBookDialog}
                onPointerEnter={loadPulledBookDialog}
              >
                <BookSpine book={book} showArt={showArt} />
              </button>
            </li>
          );
        })}
      </ul>
      <div aria-hidden className="bookshelf-board" />

      {pulled ? (
        <PulledBookDialog
          getLibrary={getLibrary}
          onOpenChange={setOpen}
          onReturned={handleReturned}
          onTaken={setTakenId}
          open={open}
          pulled={pulled}
        />
      ) : null}
    </div>
  );
}
