"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  Brain,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Circle,
  Clock,
  Copy,
  CornerDownLeft,
  CornerDownRight,
  Dot,
  Ellipsis,
  EllipsisVertical,
  Folder,
  Globe,
  Heart,
  Home,
  ImageIcon,
  Inbox,
  Lightbulb,
  Link,
  Loader,
  Lock,
  Mail,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  Paintbrush,
  Palette,
  PanelLeft,
  PanelRight,
  Pause,
  Pencil,
  Pipette,
  Play,
  Plus,
  RectangleHorizontal,
  Rocket,
  RotateCcw,
  Scaling,
  Search,
  Settings,
  Shield,
  SkipForward,
  SlidersHorizontal,
  SquareLibrary,
  Star,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useContext, useMemo } from "react";
import {
  type IconComponent,
  IconContext,
  type IconName,
} from "./icon-context-core";

export type {
  IconComponent,
  IconComponentProps,
  IconName,
} from "./icon-context-core";

export const defaultIcons: Record<IconName, IconComponent> = {
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  pipette: Pipette,
  x: X,
  copy: Copy,
  menu: Menu,
  dot: Dot,
  monitor: Monitor,
  sun: Sun,
  moon: Moon,
  "rectangle-horizontal": RectangleHorizontal,
  circle: Circle,
  "square-library": SquareLibrary,
  clock: Clock,
  star: Star,
  settings: Settings,
  plus: Plus,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  search: Search,
  loader: Loader,
  users: Users,
  lock: Lock,
  mail: Mail,
  bell: Bell,
  shield: Shield,
  palette: Palette,
  lightbulb: Lightbulb,
  rocket: Rocket,
  heart: Heart,
  paintbrush: Paintbrush,
  brain: Brain,
  globe: Globe,
  user: User,
  image: ImageIcon,
  link: Link,
  check: Check,
  "rotate-ccw": RotateCcw,
  play: Play,
  pause: Pause,
  home: Home,
  "message-circle": MessageCircle,
  inbox: Inbox,
  pencil: Pencil,
  scaling: Scaling,
  "skip-forward": SkipForward,
  "corner-down-right": CornerDownRight,
  "corner-down-left": CornerDownLeft,
  "panel-left": PanelLeft,
  "panel-right": PanelRight,
  "chevrons-up-down": ChevronsUpDown,
  "more-horizontal": Ellipsis,
  "more-vertical": EllipsisVertical,
  calendar: Calendar,
  folder: Folder,
  "sliders-horizontal": SlidersHorizontal,
};

/**
 * Returns a single icon component for the given name.
 * Falls back to the default (Lucide) set if no provider is present.
 */
function useIcon(name: IconName): IconComponent {
  const icons = useContext(IconContext);
  return (icons ?? defaultIcons)[name];
}

/**
 * Returns the full icon map.
 * Falls back to the default (Lucide) set if no provider is present.
 */
function useIcons(): Record<IconName, IconComponent> {
  const icons = useContext(IconContext);
  return icons ?? defaultIcons;
}

/**
 * Swap some or all icons for components from another library.
 * Names left out of `icons` keep their default (Lucide) component.
 */
function IconProvider({
  children,
  icons,
}: {
  children: ReactNode;
  icons?: Partial<Record<IconName, IconComponent>>;
}) {
  const value = useMemo(
    () => ({
      ...defaultIcons,
      ...icons,
    }),
    [
      icons,
    ],
  );
  return <IconContext.Provider value={value}>{children}</IconContext.Provider>;
}

export { IconProvider, useIcon, useIcons };
