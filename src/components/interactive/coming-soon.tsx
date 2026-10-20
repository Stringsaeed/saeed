"use client";

import { Figure } from "./figure";
import type { InteractiveFigureProps } from "./types";

// Stand-in for a figure that is named in a post but not built yet, so the
// prose can be written and reviewed ahead of the code.
export function ComingSoon({ name }: InteractiveFigureProps) {
  return (
    <Figure name={name} aspect="16 / 9">
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <p className="font-mono text-[11px] text-muted-foreground">
          Figure coming soon
        </p>
        <p className="font-mono text-[11px] text-muted-foreground/60">{name}</p>
      </div>
    </Figure>
  );
}
