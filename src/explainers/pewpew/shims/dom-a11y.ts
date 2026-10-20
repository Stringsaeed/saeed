// Keyboard access for the clickable non-buttons in the vendored explainer figures (the level row's fields, the
// threads chart's hop dots). The sync script patches their click bindings to go through here (see PATCHES in
// scripts/sync-pewpew.ts): each becomes focusable, is announced as a button, and Enter or Space does what a click does.
//
// Both figures rebuild the element on every repaint, so the focused one is replaced by a fresh copy. After a key
// press the helper moves focus to the copy at the same position among the figure's pressables, so the reader can
// keep going with the keyboard.

const SELECTOR = "[data-pressable]";

function scopeOf(el: Element): ParentNode {
  return el.closest(".pewpew-root") ?? el.ownerDocument;
}

function onKey(el: Element, action: () => void, event: Event): void {
  const { key } = event as KeyboardEvent;
  if (key !== "Enter" && key !== " ") return;
  event.preventDefault();
  const root = scopeOf(el);
  const index = [
    ...root.querySelectorAll(SELECTOR),
  ].indexOf(el);
  action();
  if (el.isConnected) return;
  const next = root.querySelectorAll<HTMLElement | SVGElement>(SELECTOR)[index];
  next?.focus();
}

/** Attributes for h() (dom.ts): a focusable, labelled button that runs `action` on click, Enter, or Space. */
export function pressable(
  action: () => void,
  label?: string,
): Record<string, string | number | EventListener> {
  return {
    role: "button",
    tabindex: 0,
    "data-pressable": "",
    ...(label
      ? {
          "aria-label": label,
        }
      : {}),
    onclick: () => action(),
    onkeydown(this: Element, event: Event) {
      onKey(event.currentTarget as Element, action, event);
    },
  };
}

/** The same for an element that already exists, such as an SVG shape. */
export function makePressable(
  el: HTMLElement | SVGElement,
  action: () => void,
  label?: string,
): void {
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.setAttribute("data-pressable", "");
  if (label) el.setAttribute("aria-label", label);
  el.addEventListener("click", () => action());
  el.addEventListener("keydown", (event) => onKey(el, action, event));
}
