"use client";

import {
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { LocalClock } from "@/components/local-clock";
import {
  CATS,
  CONTACT,
  FOCUS_SENTENCE,
  INTRO,
  LIBRARY,
  linkProps,
  SHIPPED,
  SIDE,
  type SiteData,
  shortDate,
  THINGS_SENTENCE,
  WORK,
} from "../data";
import { Logo } from "../logo";
import s from "./board.module.css";

// Direction 1: the site is a mainboard. Every group of content is a bank of
// parts wired to one CPU in the middle; point at a part and its bus lights
// up and the CPU reads it out. On a phone the board is one column on a
// single bus, and the CPU stays at the top as the readout.

type BankId =
  | "work"
  | "ram"
  | "rom"
  | "side"
  | "boot"
  | "misc"
  | "store"
  | "io";

type Part = {
  id: string;
  bank: BankId;
  name: string;
  meta?: string;
  text: string;
  href?: string;
  logo?: string;
  links?: readonly {
    label: string;
    href: string;
  }[];
};

const BANK_LABEL: Record<BankId, string> = {
  work: "Pipeline",
  ram: "RAM",
  rom: "ROM",
  side: "Flash",
  boot: "Boot ROM",
  misc: "Battery",
  store: "Storage",
  io: "I/O",
};

type Trace = {
  bank: string;
  d: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// One bus from the CPU to each bank, in right angles. Measured from the
// layout, so the same code routes the wide board and the phone's column.
function route(board: HTMLElement): Trace[] {
  const origin = board.getBoundingClientRect();
  const box = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const l = rect.left - origin.left;
    const t = rect.top - origin.top;
    return {
      l,
      t,
      r: l + rect.width,
      b: t + rect.height,
      cx: l + rect.width / 2,
      cy: t + rect.height / 2,
    };
  };
  const cpuElement = board.querySelector("[data-cpu]");
  if (!cpuElement) return [];
  const cpu = box(cpuElement);
  const column = cpu.r - cpu.l > origin.width * 0.75;
  const inset = 32;
  return Array.from(
    board.querySelectorAll<HTMLElement>("[data-bank]"),
    (element) => {
      const bank = box(element);
      const id = element.dataset.bank ?? "";
      if (column) {
        return {
          bank: id,
          d: `M14 0V${bank.t + 5}H${bank.l - 6}`,
        };
      }
      if (bank.b <= cpu.t || bank.t >= cpu.b) {
        const above = bank.b <= cpu.t;
        const x0 = clamp(bank.cx, cpu.l + inset, cpu.r - inset);
        const x1 = clamp(x0, bank.l + inset, bank.r - inset);
        const y0 = above ? cpu.t : cpu.b;
        const y1 = above ? bank.b : bank.t;
        return {
          bank: id,
          d: `M${x0} ${y0}V${(y0 + y1) / 2}H${x1}V${y1}`,
        };
      }
      const left = bank.r <= cpu.l;
      const y0 = clamp(bank.cy, cpu.t + inset, cpu.b - inset);
      const y1 = clamp(y0, bank.t + inset, bank.b - inset);
      const x0 = left ? cpu.l : cpu.r;
      const x1 = left ? bank.r : bank.l;
      return {
        bank: id,
        d: `M${x0} ${y0}H${(x0 + x1) / 2}V${y1}H${x1}`,
      };
    },
  );
}

export function Board({ data }: { data: SiteData }) {
  const boardRef = useRef<HTMLDivElement>(null);
  const touch = useRef(false);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const parts: Part[] = [
    ...WORK.map((entry) => ({
      id: `work:${entry.company}`,
      bank: "work" as const,
      name: entry.company,
      meta: entry.period,
      text: entry.description,
      href: entry.href,
      logo: entry.logo,
    })),
    ...data.posts.slice(0, 5).map((post) => ({
      id: `ram:${post.slug}`,
      bank: "ram" as const,
      name: post.title,
      meta: shortDate(post.date),
      text: post.description,
      href: `/blog/${post.slug}`,
    })),
    ...SHIPPED.map((app) => ({
      id: `rom:${app.id}`,
      bank: "rom" as const,
      name: app.name,
      text: app.description,
      href: app.href,
      logo: app.logo,
      links: app.links,
    })),
    ...SIDE.map((app) => ({
      id: `side:${app.id}`,
      bank: "side" as const,
      name: app.name,
      text: app.description,
      href: app.href,
      logo: app.logo,
      links: app.links,
    })),
    ...LIBRARY.map((book) => ({
      id: `boot:${book.id}`,
      bank: "boot" as const,
      name: book.title,
      meta: book.author,
      text: "On the shelf. In the real build this pulls the 3D book out, as the shelf does today.",
      logo: book.cover,
    })),
    {
      id: "misc:things",
      bank: "misc",
      name: "Things",
      text: THINGS_SENTENCE,
    },
    {
      id: "store:links",
      bank: "store",
      name: `${data.linkCount} links`,
      meta: "the archive",
      text: "Saved websites, tools, articles, and references.",
      href: "/links",
    },
    {
      id: "store:office",
      bank: "store",
      name: "Office",
      meta: `${CATS[0].name} and ${CATS[1].name} live here`,
      text: "A room you can stand in, with two cats that walk about and rest.",
      href: "/office",
    },
    {
      id: "store:blog",
      bank: "store",
      name: `${data.posts.length} posts`,
      meta: "everything written",
      text: "The whole blog. The newest five sit in RAM.",
      href: "/blog",
    },
  ];
  const active = parts.find((part) => part.id === activeId);
  const inBank = (bank: BankId) => parts.filter((part) => part.bank === bank);

  // Measured again when the readout changes, since a longer one can make
  // the CPU taller and move the banks without resizing the board.
  // biome-ignore lint/correctness/useExhaustiveDependencies: activeId is the trigger, not an input.
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const measure = () => setTraces(route(board));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    return () => observer.disconnect();
  }, [
    activeId,
  ]);

  const onPointerDown = (event: PointerEvent) => {
    touch.current = event.pointerType !== "mouse";
  };
  const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    setActiveId(event.currentTarget.dataset.part ?? null);
  };
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.matches(":focus-visible")) return;
    setActiveId(event.currentTarget.dataset.part ?? null);
  };
  // A finger has no hover: its first press reads the part out, the second
  // follows the link.
  const onClick = (event: MouseEvent<HTMLElement>) => {
    const id = event.currentTarget.dataset.part ?? null;
    if (event.currentTarget.tagName === "BUTTON") {
      setActiveId(id);
      return;
    }
    if (!touch.current || activeId === id) return;
    event.preventDefault();
    setActiveId(id);
  };

  const chip = (part: Part, className: string, body: ReactNode) => {
    const props = {
      className: `${s.part} ${className}`,
      "data-part": part.id,
      "data-active": activeId === part.id || undefined,
      onPointerDown,
      onPointerEnter,
      onFocus,
      onClick,
    };
    return part.href ? (
      <a key={part.id} href={part.href} {...linkProps(part.href)} {...props}>
        {body}
      </a>
    ) : (
      <button key={part.id} type="button" {...props}>
        {body}
      </button>
    );
  };

  return (
    <div className={s.root}>
      <div className={s.board} ref={boardRef}>
        <svg className={s.traces} aria-hidden="true">
          {traces.map((trace) => (
            <g
              key={trace.bank}
              data-lit={active?.bank === trace.bank || undefined}
            >
              <path className={s.bus} d={trace.d} />
              <path className={s.busGap} d={trace.d} />
              <path className={s.busCore} d={trace.d} />
              <path className={s.pulse} d={trace.d} />
            </g>
          ))}
        </svg>

        <section className={s.cpu} data-cpu>
          <div className={s.die}>
            <p className={s.silk}>
              <span>U1 · SAEED-1</span>
              <span>
                Dubai · <LocalClock />
              </span>
            </p>
            <h1 className={s.intro}>{INTRO}</h1>
            {active ? (
              <div className={s.readout} key={active.id} aria-live="polite">
                <p className={s.address}>
                  read {BANK_LABEL[active.bank]}
                  {active.meta ? ` · ${active.meta}` : ""}
                </p>
                <p className={s.readName}>{active.name}</p>
                <p className={s.readText}>{active.text}</p>
                {active.links || active.href ? (
                  <p className={s.readLinks}>
                    {(
                      active.links ?? [
                        {
                          label: "Open",
                          href: active.href ?? "#",
                        },
                      ]
                    ).map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        {...linkProps(link.href)}
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className={s.readout}>
                <p className={s.readText}>{FOCUS_SENTENCE}</p>
                <p className={s.address}>
                  idle · point at a part and this chip reads it out
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={`${s.bank} ${s.work}`} data-bank="work">
          <h2 className={s.label}>U2–U6 · Pipeline · previously at</h2>
          <div className={s.row}>
            {inBank("work").map((part) =>
              chip(
                part,
                s.dip,
                <>
                  {part.logo ? <Logo src={part.logo} size={18} /> : null}
                  <span className={s.partName}>{part.name}</span>
                  <span className={s.partMeta}>{part.meta}</span>
                </>,
              ),
            )}
          </div>
        </section>

        <section className={`${s.bank} ${s.misc}`} data-bank="misc">
          <h2 className={s.label}>BT1 · keeps the personal things</h2>
          <div className={s.row}>
            {inBank("misc").map((part) =>
              chip(
                part,
                s.cell,
                <>
                  <span className={s.cellPlus}>+</span>
                  <span className={s.partName}>Things</span>
                </>,
              ),
            )}
            <p className={s.xtal}>
              <span>Y1 · XTAL</span>
              <LocalClock />
            </p>
          </div>
        </section>

        <section className={`${s.bank} ${s.ram}`} data-bank="ram">
          <h2 className={s.label}>DIMM1–5 · RAM · recently written</h2>
          <div className={s.stack}>
            {inBank("ram").map((part) =>
              chip(
                part,
                s.dimm,
                <>
                  <span className={s.partName}>{part.name}</span>
                  <span className={s.partMeta}>{part.meta}</span>
                </>,
              ),
            )}
          </div>
        </section>

        <section className={`${s.bank} ${s.rom}`} data-bank="rom">
          <h2 className={s.label}>U7–U14 · ROM · shipped</h2>
          <div className={s.grid}>
            {inBank("rom").map((part) =>
              chip(
                part,
                s.eprom,
                <>
                  {part.logo ? (
                    <Logo className={s.window} src={part.logo} size={30} />
                  ) : null}
                  <span className={s.partName}>{part.name}</span>
                </>,
              ),
            )}
          </div>
        </section>

        <section className={`${s.bank} ${s.boot}`} data-bank="boot">
          <h2 className={s.label}>U15–U20 · Boot ROM · books</h2>
          <div className={s.grid3}>
            {inBank("boot").map((part) =>
              chip(
                part,
                s.soic,
                <span className={s.partName}>{part.name}</span>,
              ),
            )}
          </div>
        </section>

        <section className={`${s.bank} ${s.side}`} data-bank="side">
          <h2 className={s.label}>U21–U28 · Flash · side projects</h2>
          <div className={s.grid}>
            {inBank("side").map((part) =>
              chip(
                part,
                s.eprom,
                <>
                  {part.logo ? (
                    <Logo className={s.window} src={part.logo} size={30} />
                  ) : null}
                  <span className={s.partName}>{part.name}</span>
                </>,
              ),
            )}
          </div>
        </section>

        <section className={`${s.bank} ${s.store}`} data-bank="store">
          <h2 className={s.label}>J2 · Storage</h2>
          <div className={s.row}>
            {inBank("store").map((part) =>
              chip(
                part,
                s.drive,
                <>
                  <span className={s.partName}>{part.name}</span>
                  <span className={s.partMeta}>{part.meta}</span>
                </>,
              ),
            )}
          </div>
        </section>

        <section className={`${s.bank} ${s.io}`} data-bank="io">
          <h2 className={s.label}>J1 · I/O header · say hello</h2>
          <div className={s.header}>
            {CONTACT.map((entry) => (
              <a
                key={entry.label}
                className={s.pad}
                href={entry.href}
                {...linkProps(entry.href)}
              >
                <span className={s.pin} />
                {entry.short}
              </a>
            ))}
            <a className={s.pad} href="/cv.pdf">
              <span className={s.pin} />
              CV
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
