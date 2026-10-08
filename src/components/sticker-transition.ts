import type { StickerDefinition } from "./sticker-data";
import { stickerTransitionName } from "./sticker-data";

// One rendition for the pile and the desk, so the morph reuses a cached image.
export const STICKER_ART_SIZES = "160px";

function nameArt(scope: ParentNode, named: boolean) {
  for (const element of scope.querySelectorAll<HTMLElement>(
    "[data-sticker-art]",
  )) {
    const id = element.dataset.stickerArt as StickerDefinition["id"];
    element.style.setProperty(
      "view-transition-name",
      named ? stickerTransitionName(id) : null,
    );
    element.style.setProperty(
      "view-transition-class",
      named ? "sticker-morph" : null,
    );
  }
}

// Rendering (and so requestAnimationFrame) is paused while a view transition
// waits on its update, so watch the DOM instead.
function waitForPile() {
  return new Promise<Element | null>((resolve) => {
    const find = () => document.querySelector("[data-sticker-pile]");
    const existing = find();
    if (existing) {
      resolve(existing);
      return;
    }
    const observer = new MutationObserver(() => {
      const pile = find();
      if (!pile) return;
      finish(pile);
    });
    const timeout = window.setTimeout(() => finish(null), 1000);
    const finish = (pile: Element | null) => {
      observer.disconnect();
      window.clearTimeout(timeout);
      resolve(pile);
    };
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

// Back navigations commit synchronously in React, so they never get a React
// view transition; run one by hand to fly the stickers back onto the pile.
export function closeDeskWithTransition(desk: HTMLElement, goBack: () => void) {
  if (
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    goBack();
    return;
  }

  nameArt(desk, true);
  let pile: Element | null = null;
  const transition = document.startViewTransition(async () => {
    nameArt(desk, false);
    goBack();
    pile = await waitForPile();
    if (pile) nameArt(pile, true);
  });
  void transition.finished.finally(() => {
    nameArt(desk, false);
    if (pile) nameArt(pile, false);
  });
}
