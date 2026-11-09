import {
  RiBook2Fill,
  RiBriefcase4Fill,
  RiLinksFill,
  RiQuillPenFill,
  RiSettings4Fill,
} from "@remixicon/react";
import Image from "next/image";
import { type CSSProperties, ViewTransition } from "react";
import { STICKERS } from "@/components/sticker-data";
import { type App, type BuiltInAppId, projectApps } from "@/data/apps";
import { cn } from "@/lib/utils";

// One home-screen icon. Project apps show their logo; built-in apps draw a
// glyph on a gradient, except Things (four of the stickers), Me (the face),
// and Apps (a folder of the real apps). The same component draws the small
// icon in an app's title bar, so the two can morph into each other.

const glyphs: Partial<Record<BuiltInAppId, typeof RiBriefcase4Fill>> = {
  work: RiBriefcase4Fill,
  writing: RiQuillPenFill,
  library: RiBook2Fill,
  links: RiLinksFill,
  settings: RiSettings4Fill,
};

const faceStickers = STICKERS.filter((sticker) =>
  [
    "pyramids",
    "bass",
    "controller",
    "monstera",
  ].includes(sticker.id),
);

const folderApps = projectApps.slice(0, 9);

export function AppIcon({
  app,
  size,
  className,
  priority = false,
}: {
  app: App;
  /** Pixel size; the grid size when omitted. */
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const style = {
    "--icon-size": size ? `${size}px` : undefined,
    "--icon-a": app.kind === "builtin" ? app.gradient[0] : app.brand,
    "--icon-b": app.kind === "builtin" ? app.gradient[1] : app.brand,
  } as CSSProperties;
  const px = size ?? 60;

  if (app.kind === "project") {
    const vector = app.logo.endsWith(".svg");
    return (
      <span
        className={cn("os-icon", className)}
        style={style}
        data-fit={vector ? "contain" : undefined}
        aria-hidden="true"
      >
        <Image
          src={app.logo}
          alt=""
          width={px}
          height={px}
          sizes={`${px}px`}
          priority={priority}
          unoptimized={vector}
        />
      </span>
    );
  }

  if (app.id === "me") {
    return (
      <span
        className={cn("os-icon", className)}
        style={style}
        aria-hidden="true"
      >
        <Image
          src="/static/color.svg"
          alt=""
          width={px}
          height={px}
          priority={priority}
          unoptimized
        />
      </span>
    );
  }

  if (app.id === "things") {
    return (
      <span
        className={cn("os-icon", className)}
        style={style}
        aria-hidden="true"
      >
        <span className="os-icon-faces">
          {faceStickers.map((sticker) => (
            <Image
              key={sticker.id}
              src={sticker.src}
              alt=""
              width={sticker.width}
              height={sticker.height}
              sizes={`${Math.round(px / 2)}px`}
            />
          ))}
        </span>
      </span>
    );
  }

  if (app.id === "projects") {
    return (
      <span
        className={cn("os-icon", className)}
        style={{
          ...style,
          "--icon-a": "rgb(255 255 255 / 0.5)",
          "--icon-b": "rgb(255 255 255 / 0.3)",
        } as CSSProperties}
        aria-hidden="true"
      >
        <span className="os-icon-folder">
          {folderApps.map((item) => (
            <span key={item.id}>
              <Image
                src={item.logo}
                alt=""
                width={24}
                height={24}
                sizes="24px"
                unoptimized={item.logo.endsWith(".svg")}
              />
            </span>
          ))}
        </span>
      </span>
    );
  }

  const Glyph = glyphs[app.id] ?? RiBriefcase4Fill;
  return (
    <span
      className={cn("os-icon", className)}
      style={style}
      aria-hidden="true"
    >
      <Glyph />
    </span>
  );
}

/** The icon wrapped for a shared-element morph between home and the app. */
export function MorphingAppIcon(props: Parameters<typeof AppIcon>[0]) {
  return (
    <ViewTransition
      name={`app-${props.app.id}`}
      share="app-morph"
      default="none"
    >
      <AppIcon {...props} />
    </ViewTransition>
  );
}
