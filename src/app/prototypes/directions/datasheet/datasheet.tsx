"use client";

import { type FocusEvent, type PointerEvent, useState } from "react";
import { LocalClock } from "@/components/local-clock";
import {
  CATS,
  CONTACT,
  FOCUS,
  FOCUS_SENTENCE,
  INTRO,
  LIBRARY,
  linkProps,
  SHIPPED,
  SIDE,
  type SiteData,
  shortDate,
  THINGS,
  WORK,
} from "../data";
import { Logo } from "../logo";
import s from "./datasheet.module.css";

// Direction 4: the site is the datasheet for one component, the engineer.
// Features, operating conditions, a revision history, application notes,
// and a pinout where every pin is a way in or out: point at a pin and its
// row in the pin table lights up, and the other way round. It is a printed
// page, so a phone simply reads it top to bottom.

type Pin = {
  n: number;
  name: string;
  type: "I/O" | "O" | "IRQ" | "PWR";
  text: string;
  href?: string;
};

function pins(data: SiteData): Pin[] {
  return [
    ...CONTACT.map((entry, index) => ({
      n: index + 1,
      name: entry.short,
      type: "I/O" as const,
      text: entry.value,
      href: entry.href,
    })),
    {
      n: 7,
      name: "CV",
      type: "O",
      text: "Résumé, as a PDF",
      href: "/cv.pdf",
    },
    {
      n: 8,
      name: "GND",
      type: "PWR",
      text: "Ground. Dubai, UAE",
    },
    {
      n: 9,
      name: "IRQ0",
      type: "IRQ",
      text: `${CATS[0].name}, ${CATS[0].coat}. Asynchronous`,
      href: "/office",
    },
    {
      n: 10,
      name: "LLMS",
      type: "O",
      text: "The site as plain text, for agents",
      href: "/llms.txt",
    },
    {
      n: 11,
      name: "RSS",
      type: "O",
      text: "Feed of every post",
      href: "/feed.xml",
    },
    {
      n: 12,
      name: "OFFICE",
      type: "I/O",
      text: "A room you can stand in",
      href: "/office",
    },
    {
      n: 13,
      name: "LINKS",
      type: "O",
      text: `${data.linkCount} saved links`,
      href: "/links",
    },
    {
      n: 14,
      name: "BLOG",
      type: "O",
      text: `${data.posts.length} posts`,
      href: "/blog",
    },
    {
      n: 15,
      name: "IRQ1",
      type: "IRQ",
      text: `${CATS[1].name}, ${CATS[1].coat}. Asynchronous`,
      href: "/office",
    },
    {
      n: 16,
      name: "VCC",
      type: "PWR",
      text: "Supply. Listens for the bass first",
    },
  ];
}

export function Datasheet({ data }: { data: SiteData }) {
  const all = pins(data);
  const [active, setActive] = useState<number | null>(null);

  const onEnter = (
    event: PointerEvent<HTMLElement> | FocusEvent<HTMLElement>,
  ) => setActive(Number(event.currentTarget.dataset.pin));
  const onLeave = () => setActive(null);

  const probe = (pin: Pin) => ({
    "data-pin": pin.n,
    "data-active": active === pin.n || undefined,
    onPointerEnter: onEnter,
    onPointerLeave: onLeave,
    onFocus: onEnter,
    onBlur: onLeave,
  });

  const leg = (pin: Pin, side: "left" | "right") => {
    const body = (
      <>
        <span className={s.pinName}>{pin.name}</span>
        <span className={s.leg} />
        <span className={s.pinNo}>{pin.n}</span>
      </>
    );
    const className = `${s.pin} ${side === "left" ? s.pinLeft : s.pinRight}`;
    return pin.href ? (
      <a
        key={pin.n}
        className={className}
        href={pin.href}
        {...linkProps(pin.href)}
        {...probe(pin)}
      >
        {body}
      </a>
    ) : (
      <span key={pin.n} className={className} {...probe(pin)}>
        {body}
      </span>
    );
  };

  const appRows = (apps: typeof SHIPPED) => (
    <ul className={s.parts}>
      {apps.map((app) => (
        <li key={app.id}>
          <Logo src={app.logo} size={18} />
          <a href={app.href} {...linkProps(app.href)}>
            {app.name}
          </a>
          <span>{app.description}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={s.root}>
      <article className={s.sheet}>
        <header className={s.head}>
          <div>
            <p className={s.partNo}>SAEED</p>
            <h1 className={s.title}>{INTRO}</h1>
          </div>
          <dl className={s.rev}>
            <div>
              <dt>Document</dt>
              <dd>Datasheet</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>Nov 2026</dd>
            </div>
            <div>
              <dt>Origin</dt>
              <dd>Dubai, UAE</dd>
            </div>
            <div>
              <dt>Local time</dt>
              <dd>
                <LocalClock />
              </dd>
            </div>
          </dl>
        </header>

        <div className={s.cols}>
          <div className={s.col}>
            <section>
              <h2>Features</h2>
              <ul className={s.bullets}>
                {FOCUS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2>Description</h2>
              <p>
                {FOCUS_SENTENCE} Previously at{" "}
                {WORK.map((entry) => entry.company).join(", ")}.
              </p>
            </section>

            <section>
              <h2>Operating conditions</h2>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Typical</th>
                  </tr>
                </thead>
                <tbody>
                  {THINGS.map((thing) => (
                    <tr key={thing.id}>
                      <td>{thing.lead.replace(/^I /, "")}</td>
                      <td>{thing.rest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section>
              <h2>Revision history</h2>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>At</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {WORK.map((entry) => (
                    <tr key={entry.company}>
                      <td className={s.nowrap}>{entry.period}</td>
                      <td>
                        <a href={entry.href} {...linkProps(entry.href)}>
                          {entry.company}
                        </a>
                      </td>
                      <td>{entry.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <div className={s.col}>
            <section>
              <h2>Pin configuration</h2>
              <figure className={s.figure}>
                <div className={s.package}>
                  <div className={s.pinCol}>
                    {all.slice(0, 8).map((pin) => leg(pin, "left"))}
                  </div>
                  <div className={s.body}>
                    <span className={s.notch} />
                    <span className={s.marking}>SAEED</span>
                    <span className={s.markingSmall}>top view</span>
                  </div>
                  <div className={s.pinCol}>
                    {all
                      .slice(8)
                      .reverse()
                      .map((pin) => leg(pin, "right"))}
                  </div>
                </div>
                <figcaption>
                  Figure 1. 16 pins, every one a way in or out. Point at a pin.
                </figcaption>
              </figure>
            </section>

            <section>
              <h2>Pin functions</h2>
              <table className={`${s.table} ${s.pinTable}`}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {all.map((pin) => (
                    <tr key={pin.n} {...probe(pin)}>
                      <td>{pin.n}</td>
                      <td>
                        {pin.href ? (
                          <a href={pin.href} {...linkProps(pin.href)}>
                            {pin.name}
                          </a>
                        ) : (
                          pin.name
                        )}
                      </td>
                      <td>{pin.type}</td>
                      <td>{pin.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <div className={s.col}>
            <section>
              <h2>Typical applications</h2>
              <p className={s.note}>Shipped, and in the stores.</p>
              {appRows(SHIPPED)}
            </section>

            <section>
              <h2>Reference designs</h2>
              <p className={s.note}>Side projects, most with source.</p>
              {appRows(SIDE)}
            </section>

            <section>
              <h2>Application notes</h2>
              <table className={s.table}>
                <tbody>
                  {data.posts.slice(0, 6).map((post, index) => (
                    <tr key={post.slug}>
                      <td className={s.nowrap}>
                        AN-{String(data.posts.length - index).padStart(2, "0")}
                      </td>
                      <td>
                        <a href={`/blog/${post.slug}`}>{post.title}</a>
                      </td>
                      <td className={s.nowrap}>{shortDate(post.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={s.note}>
                <a href="/blog">All {data.posts.length} notes →</a>
              </p>
            </section>

            <section>
              <h2>Further reading</h2>
              <ul className={s.refs}>
                {LIBRARY.map((book, index) => (
                  <li key={book.id}>
                    <span>[{index + 1}]</span>
                    <span>
                      {book.author}, <i>{book.title}</i>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <footer className={s.foot}>
          <span>SAEED · software engineer</span>
          <a href={CONTACT[0].href}>Submit documentation feedback</a>
          <span>Page 1 of 1</span>
        </footer>
      </article>
    </div>
  );
}
