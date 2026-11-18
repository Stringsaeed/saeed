"use client";

import { useCallback, useEffect, useState } from "react";
import { Picker } from "../_picker/picker";
import { Board } from "./board/board";
import type { SiteData } from "./data";
import { Datasheet } from "./datasheet/datasheet";
import { Desktop } from "./desktop/desktop";
import { GitLog } from "./gitlog/gitlog";
import { Tui } from "./tui/tui";

const VARIANTS = [
  {
    id: "board",
    name: "Board",
    title: "A mainboard: the CPU reads out whatever chip you point at",
    Component: Board,
  },
  {
    id: "desktop",
    name: "Desktop",
    title: "An operating system of his own, with windows and two cats",
    Component: Desktop,
  },
  {
    id: "tui",
    name: "TUI",
    title: "A terminal you steer with the keyboard, not one you type into",
    Component: Tui,
  },
  {
    id: "datasheet",
    name: "Sheet",
    title: "The component datasheet for one engineer, with a pinout",
    Component: Datasheet,
  },
  {
    id: "git",
    name: "Git",
    title: "A commit graph: work on main, writing on a branch",
    Component: GitLog,
  },
] as const;

const PICKER_ITEMS = VARIANTS.map((variant) => ({
  name: variant.name,
  title: variant.title,
}));

export function Directions({
  data,
  initial,
}: {
  data: SiteData;
  initial?: string;
}) {
  const [current, setCurrent] = useState(() =>
    Math.max(
      0,
      VARIANTS.findIndex((variant) => variant.id === initial),
    ),
  );

  const select = useCallback((index: number) => {
    setCurrent(index);
    const url = new URL(window.location.href);
    url.searchParams.set("v", VARIANTS[index].id);
    window.history.replaceState(null, "", url);
  }, []);

  // [ and ] step through the variants. The digits and arrows stay free,
  // because the TUI variant steers with them.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "[" && event.key !== "]") return;
      // Typing a bracket into a field, or into the shell, is not a switch.
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea"))
        return;
      const step = event.key === "]" ? 1 : -1;
      select((current + step + VARIANTS.length) % VARIANTS.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    current,
    select,
  ]);

  const { Component, id } = VARIANTS[current];
  return (
    <>
      <Component key={id} data={data} />
      <Picker
        items={PICKER_ITEMS}
        current={current}
        position="bottom"
        onSelect={select}
      />
    </>
  );
}
