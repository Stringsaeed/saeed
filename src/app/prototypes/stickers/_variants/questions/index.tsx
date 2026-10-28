"use client";

import Image from "next/image";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { STICKERS } from "@/components/sticker-data";
import { playSound } from "@/lib/sound";
import { QUESTION_ORDER, QUESTIONS, type StickerId } from "./questions";
import styles from "./questions.module.css";

// biome-ignore lint/style/useComponentExportOnlyModules: read by the prototype registry.
export const kind = "inline";
// biome-ignore lint/style/useComponentExportOnlyModules: read by the prototype registry.
export const pickerPosition = "bottom";

const ANSWERS = QUESTION_ORDER.flatMap((id) =>
  STICKERS.filter((sticker) => sticker.id === id),
);

const FIRST_QUESTION: StickerId = "keyboard";

export default function Questions() {
  const invitationId = useId();
  const indexId = useId();
  const indexHeadingId = useId();
  const [selected, setSelected] = useState<StickerId>("keyboard");
  const [expanded, setExpanded] = useState(false);
  const answersRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocus = useRef(false);

  useEffect(() => {
    // Without enhancement, the index links to eight complete, readable answers.
    answersRef.current?.setAttribute("data-enhanced", "true");
    const readHash = () => {
      const id = QUESTION_ORDER.find(
        (item) => `#${item}` === window.location.hash,
      );
      const next = id ?? (window.location.hash ? undefined : FIRST_QUESTION);
      if (!next) return;
      shouldFocus.current = true;
      setExpanded(false);
      setSelected(next);
      if (headingRef.current?.id === next) {
        shouldFocus.current = false;
        headingRef.current.focus();
      }
    };
    if (window.location.hash) readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    return () => {
      window.removeEventListener("hashchange", readHash);
      window.removeEventListener("popstate", readHash);
    };
  }, []);

  useLayoutEffect(() => {
    if (!shouldFocus.current || headingRef.current?.id !== selected) return;
    shouldFocus.current = false;
    headingRef.current?.focus({
      preventScroll: true,
    });
    headingRef.current?.scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }, [
    selected,
  ]);

  const choose = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const id = QUESTION_ORDER.find(
        (item) => `#${item}` === event.currentTarget.hash,
      );
      if (!id) return;
      event.preventDefault();
      playSound("tap");
      if (window.location.hash !== `#${id}`) {
        window.history.pushState(window.history.state, "", `#${id}`);
      }
      setExpanded(false);
      if (selected === id) {
        headingRef.current?.focus({
          preventScroll: true,
        });
        headingRef.current?.scrollIntoView({
          block: "start",
          behavior: "instant",
        });
      } else {
        shouldFocus.current = true;
        setSelected(id);
      }
    },
    [
      selected,
    ],
  );

  const toggleCloser = useCallback(() => setExpanded((value) => !value), []);

  return (
    <section className={styles.section} aria-labelledby={invitationId}>
      <header className={styles.invitation}>
        <h2 id={invitationId} className={styles.lead}>
          <a href={`#${FIRST_QUESTION}`} onClick={choose}>
            What does your childhood sound like?{" "}
            <Image
              src="/stickers/lofree-block.png"
              alt=""
              width={72}
              height={48}
              sizes="72px"
              className={styles.punctuation}
            />
          </a>
        </h2>
        <p className={styles.subtitle}>Ask me something personal.</p>
        <a className={styles.indexJump} href={`#${indexId}`}>
          All eight questions <span aria-hidden="true">↙</span>
        </a>
      </header>

      <div ref={answersRef} className={styles.answers}>
        {ANSWERS.map((sticker, index) => (
          <article
            key={sticker.id}
            className={styles.answer}
            data-active={selected === sticker.id}
            aria-labelledby={sticker.id}
          >
            <div className={styles.answerMeta}>
              <span>
                {String(index + 1).padStart(2, "0")}{" "}
                <span className={styles.slash}>/</span> 8
              </span>
              <span>{sticker.label}</span>
            </div>
            <h3
              id={sticker.id}
              ref={selected === sticker.id ? headingRef : undefined}
              tabIndex={-1}
              className={styles.question}
            >
              {QUESTIONS[sticker.id].question}
            </h3>
            <figure className={styles.figure}>
              <div
                className={styles.illustration}
                data-expanded={expanded && selected === sticker.id}
              >
                <Image
                  src={sticker.src}
                  alt={sticker.label}
                  fill
                  sizes={
                    expanded && selected === sticker.id
                      ? "(max-width: 704px) calc(100vw - 48px), 640px"
                      : "(max-width: 540px) 240px, 320px"
                  }
                  className={styles.art}
                  data-sticker-art
                  loading="eager"
                />
              </div>
              <figcaption className={styles.caption}>
                {sticker.id === "controller" ? (
                  <span className={styles.gloss}>
                    <bdi lang="ar" dir="rtl">
                      يابانية?
                    </bdi>{" "}
                    <span>Japanese?</span>
                  </span>
                ) : null}
                <button
                  type="button"
                  className={styles.closer}
                  onClick={toggleCloser}
                  aria-expanded={expanded && selected === sticker.id}
                >
                  {expanded && selected === sticker.id
                    ? "Return to answer"
                    : "Look closer"}{" "}
                  <span aria-hidden="true">
                    {expanded && selected === sticker.id ? "−" : "+"}
                  </span>
                </button>
              </figcaption>
            </figure>
            <div className={styles.story}>
              {sticker.story.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <nav
              className={styles.followups}
              aria-label={`Follow-up questions after ${sticker.label}`}
            >
              <p className={styles.label}>Or ask me</p>
              {QUESTIONS[sticker.id].related.map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={choose}
                  aria-label={`${QUESTIONS[id].question} — ${STICKERS.find((item) => item.id === id)?.label}`}
                >
                  <span>{QUESTIONS[id].question}</span>
                  <span className={styles.arrow} aria-hidden="true">
                    ↗
                  </span>
                </a>
              ))}
            </nav>
          </article>
        ))}
      </div>

      <nav
        id={indexId}
        className={styles.index}
        aria-labelledby={indexHeadingId}
      >
        <h3 id={indexHeadingId} className={styles.label}>
          All eight questions
        </h3>
        <ol>
          {ANSWERS.map((sticker) => (
            <li key={sticker.id}>
              <a
                href={`#${sticker.id}`}
                onClick={choose}
                aria-current={selected === sticker.id ? "true" : undefined}
                aria-label={`${QUESTIONS[sticker.id].question} — ${sticker.label}`}
              >
                {QUESTIONS[sticker.id].question}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <a href="/" className={styles.leave}>
        Back to the site <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
