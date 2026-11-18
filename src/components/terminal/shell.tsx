"use client";

import { BashShell } from "@wterm/just-bash";
import { Terminal, useTerminal } from "@wterm/react";
import "@wterm/react/css";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { build } from "./repo";
import type { SiteData } from "./site-data";
import { HOME, SCRIPTS, siteFiles } from "./site-files";
import s from "./terminal.module.css";

// The shell tab: a real terminal (wterm, drawn as DOM text) running a small
// bash in the browser over a virtual home directory that holds the site.
// The row of buttons runs the scripts in ~/bin for anyone who would rather
// not type. Loaded only when the tab is first opened.

function prompt(cwd: string) {
  const where = cwd === HOME ? "~" : cwd.replace(`${HOME}/`, "~/");
  return `\x1b[38;2;166;217;119msaeed\x1b[0m\x1b[38;2;125;122;114m@dubai\x1b[0m \x1b[38;2;132;203;217m${where}\x1b[0m $ `;
}

async function readPosts(data: SiteData) {
  const entries = await Promise.all(
    data.posts.map(async (post) => {
      try {
        const response = await fetch(`/blog/${post.slug}/markdown`);
        return [
          post.slug,
          response.ok ? await response.text() : `# ${post.title}\n`,
        ] as const;
      } catch {
        return [
          post.slug,
          `# ${post.title}\n`,
        ] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

export default function Shell({
  data,
  active,
}: {
  data: SiteData;
  /** Whether this tab is the one in front. */
  active: boolean;
}) {
  const { ref, write, focus } = useTerminal();
  const shellRef = useRef<BashShell | null>(null);
  const started = useRef(false);
  const [ready, setReady] = useState(false);

  const onReady = () => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const posts = await readPosts(data);
      const shell = new BashShell({
        files: siteFiles(data, build(data), posts, window.location.origin),
        cwd: HOME,
        env: {
          HOME,
          PATH: `${HOME}/bin:/usr/bin:/bin`,
          SHELL: "/bin/bash",
          TERM: "xterm-256color",
          USER: "saeed",
        },
        greeting: [
          "The site, as a shell. Nothing you type leaves your browser.",
          "Run \x1b[38;2;166;217;119mmenu\x1b[0m for the scripts, or press a button above.",
          "",
        ],
        prompt,
      });
      await shell.attach(write);
      // Files arrive without the execute bit; the scripts need it to run
      // by name.
      await shell.bash?.exec(`chmod +x ${HOME}/bin/*`);
      shellRef.current = shell;
      setReady(true);
    })();
  };

  const onData = (input: string) => {
    void shellRef.current?.handleInput(input);
  };

  // Type a command and press return, as a visitor would.
  const onRun = async (event: MouseEvent<HTMLButtonElement>) => {
    const shell = shellRef.current;
    const command = event.currentTarget.dataset.run;
    if (!shell || !command) return;
    // Clear whatever is half-typed, so the command runs as written.
    await shell.handleInput("\x15");
    for (const char of command) await shell.handleInput(char);
    await shell.handleInput("\r");
    focus();
  };

  useEffect(() => {
    if (active && ready) focus();
  }, [
    active,
    ready,
    focus,
  ]);

  return (
    <div className={s.shell}>
      <div className={s.scripts}>
        <span className={s.scriptsLabel}>~/bin</span>
        {SCRIPTS.map((entry) => (
          <button
            key={entry.run}
            type="button"
            data-run={entry.run}
            title={entry.says}
            disabled={!ready}
            onClick={onRun}
          >
            {entry.run}
          </button>
        ))}
        <button
          type="button"
          data-run="clear"
          title="clear the screen"
          disabled={!ready}
          onClick={onRun}
        >
          clear
        </button>
      </div>
      <Terminal
        ref={ref}
        className={s.term}
        theme="saeed"
        autoResize
        cursorBlink
        renderingPaused={!active}
        aria-label="Shell"
        onReady={onReady}
        onData={onData}
      />
    </div>
  );
}
