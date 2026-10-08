"use client";

import { type ComponentType, createContext, useContext } from "react";

// The context and its types live apart from the default (Lucide) icon map so a
// component that needs one or two icons doesn't ship the whole set.

export interface IconComponentProps {
  size?: string | number;
  strokeWidth?: string | number;
  className?: string;
  "data-icon"?: "inline-start" | "inline-end";
}

export type IconComponent = ComponentType<IconComponentProps>;

export type IconName =
  | "chevron-right"
  | "chevron-down"
  | "x"
  | "copy"
  | "menu"
  | "dot"
  | "monitor"
  | "sun"
  | "moon"
  | "rectangle-horizontal"
  | "circle"
  | "square-library"
  | "clock"
  | "star"
  | "settings"
  | "plus"
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "arrow-down"
  | "search"
  | "loader"
  | "users"
  | "lock"
  | "mail"
  | "bell"
  | "shield"
  | "palette"
  | "lightbulb"
  | "rocket"
  | "heart"
  | "paintbrush"
  | "brain"
  | "globe"
  | "user"
  | "image"
  | "link"
  | "check"
  | "rotate-ccw"
  | "play"
  | "pause"
  | "pipette"
  | "home"
  | "message-circle"
  | "inbox"
  | "pencil"
  | "scaling"
  | "skip-forward"
  | "corner-down-right"
  | "corner-down-left"
  | "panel-left"
  | "panel-right"
  | "chevrons-up-down"
  | "more-horizontal"
  | "more-vertical"
  | "calendar"
  | "folder"
  | "sliders-horizontal";

export const IconContext = createContext<Record<
  IconName,
  IconComponent
> | null>(null);

/** The provider's icon for `name`, or `fallback` when none is provided. */
export function useIconOverride(
  name: IconName,
  fallback: IconComponent,
): IconComponent {
  return useContext(IconContext)?.[name] ?? fallback;
}
