import type { ReactNode } from "react";
import s from "./terminal.module.css";

// What a page puts in its tab: the command that would have printed it, then
// the page itself. `wide` is for lists that use the whole pane; without it
// the page keeps a reading measure.
export function TabPage({
  command,
  note,
  wide = false,
  children,
}: {
  command: string;
  /** Said after the command, quietly: a count, a date. */
  note?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <main className={wide ? s.sheet : s.prose}>
      <p className={s.kicker}>
        $ {command}
        {note ? <span className={s.dim}> · {note}</span> : null}
      </p>
      {children}
    </main>
  );
}
