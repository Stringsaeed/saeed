"use client";

import { type MouseEvent, useState } from "react";
import { LocalClock } from "@/components/local-clock";
import {
  type App,
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
import s from "./gitlog.module.css";

// Direction 5: the site is a repository's history. Work is the main branch,
// writing is a branch beside it, shipped apps are tags on the commits that
// made them, side projects are branches, and the contact links are the
// remotes. Press a commit to see its diff; check out a branch to dim the
// other. It is a list, so a phone reads it as one.

type Lane = "main" | "writing";

type Commit = {
  id: string;
  lane: Lane;
  when: number;
  date: string;
  type: string;
  message: string;
  lines: readonly string[];
  href?: string;
  linkLabel?: string;
  logo?: string;
  tags: readonly App[];
};

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

// "Apr 2026 to Sep 2026" or "2025 to 2026": when the job began.
function periodStart(period: string) {
  const match = period.match(/(?:([A-Za-z]{3})\s+)?(\d{4})/);
  if (!match) return 0;
  const month = match[1] ? MONTHS.indexOf(match[1].toLowerCase()) : 0;
  return Date.UTC(Number(match[2]), Math.max(month, 0), 1);
}

// A short hash that is the same on every render. Decoration, not identity.
function hash(text: string) {
  let value = 2166136261;
  for (const char of text) {
    value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

function history(data: SiteData): Commit[] {
  const tagged = new Set<string>();
  const work: Commit[] = WORK.map((entry) => {
    const tags = SHIPPED.filter((app) =>
      app.name.toLowerCase().includes(entry.company.toLowerCase()),
    );
    for (const app of tags) tagged.add(app.id);
    return {
      id: `work-${entry.company}`,
      lane: "main",
      when: periodStart(entry.period),
      date: entry.period,
      type: "feat",
      message: entry.company,
      lines: [
        entry.description,
      ],
      href: entry.href,
      linkLabel: `Visit ${entry.company}`,
      logo: entry.logo,
      tags,
    };
  });
  const posts: Commit[] = data.posts.slice(0, 6).map((post) => ({
    id: `post-${post.slug}`,
    lane: "writing",
    when: Date.parse(post.date),
    date: shortDate(post.date),
    type: "docs",
    message: post.title,
    lines: [
      post.description,
      `tags: ${post.tags.join(", ")}`,
    ],
    href: `/blog/${post.slug}`,
    linkLabel: "Read the post",
    tags: [],
  }));
  const rest = [
    ...work,
    ...posts,
  ].sort((a, b) => b.when - a.when);
  return [
    {
      id: "head",
      lane: "main",
      when: Number.POSITIVE_INFINITY,
      date: "now",
      type: "merge",
      message: INTRO,
      lines: [
        FOCUS_SENTENCE,
        THINGS_SENTENCE,
      ],
      tags: [],
    },
    ...rest,
    {
      id: "root",
      lane: "main",
      when: 0,
      // Undated in the site's data, so it says no more than that.
      date: "undated",
      type: "also",
      message: "More apps in the stores",
      lines: [
        "Shipped, and not tied to a company above.",
      ],
      tags: SHIPPED.filter((app) => !tagged.has(app.id)),
    },
  ];
}

const X = {
  main: 14,
  writing: 40,
} as const;

export function GitLog({ data }: { data: SiteData }) {
  const commits = history(data);
  const [openId, setOpenId] = useState<string | null>("head");
  const [branch, setBranch] = useState<Lane | null>(null);

  const lastPost = commits.findLastIndex((commit) => commit.lane === "writing");

  const onCommit = (event: MouseEvent<HTMLElement>) => {
    const id = event.currentTarget.dataset.commit ?? null;
    setOpenId((current) => (current === id ? null : id));
  };

  const onBranch = (event: MouseEvent<HTMLElement>) => {
    const next = event.currentTarget.dataset.branch as Lane;
    setBranch((current) => (current === next ? null : next));
  };

  return (
    <div className={s.root} data-branch={branch ?? undefined}>
      <div className={s.page}>
        <main className={s.log}>
          <h1 className={s.srOnly}>{INTRO}</h1>
          <p className={s.prompt}>
            <span>$</span> git log --graph --all
          </p>
          <ol className={s.commits}>
            {commits.map((commit, index) => {
              const open = openId === commit.id;
              const first = index === 0;
              const last = index === commits.length - 1;
              const through = !first && index < lastPost;
              return (
                <li
                  key={commit.id}
                  className={s.commit}
                  data-lane={commit.lane}
                  data-head={first || undefined}
                >
                  <div className={s.graph} aria-hidden="true">
                    <svg
                      className={s.joint}
                      viewBox="0 0 56 44"
                      aria-hidden="true"
                    >
                      {first ? null : <path className={s.main} d="M14 0V22" />}
                      {last ? null : <path className={s.main} d="M14 22V44" />}
                      {through ? (
                        <path className={s.writing} d="M40 0V44" />
                      ) : null}
                      {first && lastPost > 0 ? (
                        <path
                          className={s.writing}
                          d="M14 22C14 38 40 28 40 44"
                        />
                      ) : null}
                      {index === lastPost ? (
                        <path
                          className={s.writing}
                          d="M40 0V22C40 38 14 28 14 44"
                        />
                      ) : null}
                      <circle
                        className={s[commit.lane]}
                        cx={X[commit.lane]}
                        cy="22"
                        r={first ? 6 : 4.5}
                      />
                    </svg>
                    <span className={s.tail}>
                      {last ? null : <i className={s.main} />}
                      {index < lastPost ? <i className={s.writing} /> : null}
                    </span>
                  </div>

                  <div className={s.entry}>
                    <button
                      type="button"
                      className={s.line}
                      data-commit={commit.id}
                      aria-expanded={open}
                      onClick={onCommit}
                    >
                      <span className={s.hash}>{hash(commit.id)}</span>
                      <span className={s.what}>
                        {first ? (
                          <span className={s.ref}>HEAD → main</span>
                        ) : null}
                        {commit.logo ? (
                          <Logo src={commit.logo} size={16} />
                        ) : null}
                        <span className={s.message}>
                          {first ? null : (
                            <span className={s.type}>{commit.type}: </span>
                          )}
                          {commit.message}
                        </span>
                        {commit.tags.map((app) => (
                          <span key={app.id} className={s.tag}>
                            <Logo src={app.logo} size={12} />
                            {app.name}
                          </span>
                        ))}
                      </span>
                      <span className={s.date}>
                        {first ? <LocalClock /> : commit.date}
                      </span>
                    </button>
                    {open ? (
                      <div className={s.diff}>
                        {commit.lines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                        {commit.tags.map((app) => (
                          <p key={app.id}>
                            <b>{app.name}.</b> {app.description}{" "}
                            {app.links.map((link) => (
                              <a
                                key={link.href}
                                href={link.href}
                                {...linkProps(link.href)}
                              >
                                {link.label} ↗
                              </a>
                            ))}
                          </p>
                        ))}
                        {commit.href ? (
                          <p className={s.go}>
                            <a href={commit.href} {...linkProps(commit.href)}>
                              {commit.linkLabel} ↗
                            </a>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </main>

        <aside className={s.side}>
          <section>
            <p className={s.prompt}>
              <span>$</span> git branch
            </p>
            <ul className={s.list}>
              <li>
                <button
                  type="button"
                  className={s.branch}
                  data-branch="main"
                  aria-pressed={branch === "main"}
                  onClick={onBranch}
                >
                  <i className={s.main} /> main
                </button>
                <span>work, {WORK.length} companies</span>
              </li>
              <li>
                <button
                  type="button"
                  className={s.branch}
                  data-branch="writing"
                  aria-pressed={branch === "writing"}
                  onClick={onBranch}
                >
                  <i className={s.writing} /> writing
                </button>
                <a href="/blog">all {data.posts.length} posts ↗</a>
              </li>
              {SIDE.map((app) => (
                <li key={app.id}>
                  <a
                    className={s.branch}
                    href={app.href}
                    title={app.description}
                    {...linkProps(app.href)}
                  >
                    <Logo src={app.logo} size={14} /> side/{app.id}
                  </a>
                  <span>{app.description}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className={s.prompt}>
              <span>$</span> git remote -v
            </p>
            <ul className={s.list}>
              {CONTACT.map((entry) => (
                <li key={entry.label}>
                  <a href={entry.href} {...linkProps(entry.href)}>
                    {entry.label.toLowerCase()}
                  </a>
                  <span>{entry.value}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className={s.prompt}>
              <span>$</span> git stash list
            </p>
            <ul className={s.list}>
              <li>
                <a href="/links">links</a>
                <span>{data.linkCount} saved links</span>
              </li>
              <li>
                <a href="/office">office</a>
                <span>a room you can stand in</span>
              </li>
              <li>
                <a href="/cv.pdf">cv.pdf</a>
                <span>the résumé</span>
              </li>
              {LIBRARY.map((book) => (
                <li key={book.id}>
                  <span className={s.book}>{book.title}</span>
                  <span>{book.author}</span>
                </li>
              ))}
            </ul>
          </section>

          <p className={s.trailer}>
            {CATS.map((cat) => (
              <span key={cat.name}>
                Co-authored-by: {cat.name} ({cat.coat})
              </span>
            ))}
          </p>
        </aside>
      </div>
    </div>
  );
}
