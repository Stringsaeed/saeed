"use client";

import { bind, type SoundName } from "cuelume";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Rectangle = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type StickerDefinition = {
  id: "bass" | "keyboard" | "monstera";
  sound: SoundName;
  src: string;
  width: number;
  height: number;
};

type StickerPlacement = StickerDefinition & {
  left: number;
  offsetX: number;
  offsetY: number;
  top: number;
  rotation: number;
};

type FieldGeometry = {
  height: number;
  protectedRectangles: Rectangle[];
  width: number;
};

type DragState = {
  element: HTMLElement;
  id: StickerPlacement["id"];
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
};

const STICKERS: StickerDefinition[] = [
  {
    id: "keyboard",
    sound: "toggle",
    src: "/stickers/keyboard.png",
    width: 240,
    height: 160,
  },
  {
    id: "monstera",
    sound: "bloom",
    src: "/stickers/monstera.png",
    width: 184,
    height: 184,
  },
  {
    id: "bass",
    sound: "pulse",
    src: "/stickers/bass.png",
    width: 160,
    height: 191,
  },
];

const MINIMUM_VIEWPORT_WIDTH = 960;
const EDGE_PADDING = 24;
const CONTENT_CLEARANCE = 18;
const STICKER_CLEARANCE = 22;
const PLACEMENT_ATTEMPTS = 80;

function createRandom(seed: number) {
  let value = seed;

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(random: () => number, minimum: number, maximum: number) {
  return minimum + random() * (maximum - minimum);
}

function rotatedSize(width: number, height: number, degrees: number) {
  const radians = (Math.abs(degrees) * Math.PI) / 180;

  return {
    width:
      Math.abs(width * Math.cos(radians)) +
      Math.abs(height * Math.sin(radians)),
    height:
      Math.abs(width * Math.sin(radians)) +
      Math.abs(height * Math.cos(radians)),
  };
}

function rectanglesOverlap(first: Rectangle, second: Rectangle, clearance = 0) {
  return !(
    first.right + clearance <= second.left ||
    first.left >= second.right + clearance ||
    first.bottom + clearance <= second.top ||
    first.top >= second.bottom + clearance
  );
}

function getScale(viewportWidth: number) {
  if (viewportWidth < 1120) return 0.7;
  if (viewportWidth < 1360) return 0.85;
  return 1;
}

function getFieldGeometry(field: HTMLElement): FieldGeometry {
  const fieldRect = field.getBoundingClientRect();

  return {
    height: fieldRect.height,
    protectedRectangles: Array.from(
      document.querySelectorAll<HTMLElement>("[data-sticker-protected]"),
    ).map((element) => {
      const rect = element.getBoundingClientRect();

      return {
        left: rect.left - fieldRect.left,
        top: rect.top - fieldRect.top,
        right: rect.right - fieldRect.left,
        bottom: rect.bottom - fieldRect.top,
      };
    }),
    width: fieldRect.width,
  };
}

function getStickerRectangle(sticker: StickerPlacement): Rectangle {
  const bounds = rotatedSize(sticker.width, sticker.height, sticker.rotation);
  const left =
    sticker.left + sticker.offsetX - (bounds.width - sticker.width) / 2;
  const top =
    sticker.top + sticker.offsetY - (bounds.height - sticker.height) / 2;

  return {
    left,
    top,
    right: left + bounds.width,
    bottom: top + bounds.height,
  };
}

function isPlacementValid(
  candidate: StickerPlacement,
  placements: StickerPlacement[],
  geometry: FieldGeometry,
) {
  const rectangle = getStickerRectangle(candidate);
  const staysInField =
    rectangle.left >= EDGE_PADDING &&
    rectangle.top >= EDGE_PADDING &&
    rectangle.right <= geometry.width - EDGE_PADDING &&
    rectangle.bottom <= geometry.height - EDGE_PADDING;
  if (!staysInField) return false;

  const coversContent = geometry.protectedRectangles.some(
    (protectedRectangle) =>
      rectanglesOverlap(rectangle, protectedRectangle, CONTENT_CLEARANCE),
  );
  if (coversContent) return false;

  return placements.every(
    (sticker) =>
      sticker.id === candidate.id ||
      !rectanglesOverlap(
        rectangle,
        getStickerRectangle(sticker),
        STICKER_CLEARANCE,
      ),
  );
}

function moveSticker(
  placements: StickerPlacement[],
  id: StickerPlacement["id"],
  offsetX: number,
  offsetY: number,
  geometry: FieldGeometry,
) {
  const index = placements.findIndex((sticker) => sticker.id === id);
  const current = placements[index];
  if (!current) return placements;

  let next = current;
  const horizontal = {
    ...next,
    offsetX,
  };
  if (isPlacementValid(horizontal, placements, geometry)) next = horizontal;

  const vertical = {
    ...next,
    offsetY,
  };
  if (isPlacementValid(vertical, placements, geometry)) next = vertical;

  if (next === current) return placements;

  return placements.map((sticker, stickerIndex) =>
    stickerIndex === index ? next : sticker,
  );
}

function placeStickers(geometry: FieldGeometry, seed: number) {
  if (geometry.width < MINIMUM_VIEWPORT_WIDTH) return [];

  const protectedColumn = geometry.protectedRectangles[0];
  if (!protectedColumn) return [];

  const scale = getScale(geometry.width);
  const random = createRandom(seed);
  const occupied: Rectangle[] = [];
  const placements: StickerPlacement[] = [];
  const firstStickerStartsOnLeft = random() < 0.5;

  for (const [index, sticker] of STICKERS.entries()) {
    const width = sticker.width * scale;
    const height = sticker.height * scale;
    const rotation = randomBetween(random, -15, 15);
    const bounds = rotatedSize(width, height, rotation);
    const leftRegion = {
      minimum: EDGE_PADDING,
      maximum: protectedColumn.left - CONTENT_CLEARANCE - bounds.width,
    };
    const rightRegion = {
      minimum: protectedColumn.right + CONTENT_CLEARANCE,
      maximum: geometry.width - EDGE_PADDING - bounds.width,
    };
    const prefersLeft =
      index % 2 === 0 ? firstStickerStartsOnLeft : !firstStickerStartsOnLeft;
    const regions = prefersLeft
      ? [
          leftRegion,
          rightRegion,
        ]
      : [
          rightRegion,
          leftRegion,
        ];
    let placement: StickerPlacement | undefined;

    for (const region of regions) {
      if (region.maximum < region.minimum) continue;

      for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt += 1) {
        const maximumTop = geometry.height - EDGE_PADDING - bounds.height;
        if (maximumTop < EDGE_PADDING) break;

        const left = randomBetween(random, region.minimum, region.maximum);
        const top = randomBetween(random, EDGE_PADDING, maximumTop);
        const rectangle = {
          left,
          top,
          right: left + bounds.width,
          bottom: top + bounds.height,
        };
        const coversContent = geometry.protectedRectangles.some(
          (protectedRectangle) =>
            rectanglesOverlap(rectangle, protectedRectangle, CONTENT_CLEARANCE),
        );
        const coversSticker = occupied.some((occupiedRectangle) =>
          rectanglesOverlap(rectangle, occupiedRectangle, STICKER_CLEARANCE),
        );

        if (coversContent || coversSticker) continue;

        occupied.push(rectangle);
        placement = {
          ...sticker,
          width,
          height,
          left: left + (bounds.width - width) / 2,
          offsetX: 0,
          offsetY: 0,
          top: top + (bounds.height - height) / 2,
          rotation,
        };
        break;
      }

      if (placement) break;
    }

    if (placement) placements.push(placement);
  }

  return placements;
}

function getSeed() {
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return values[0] ?? Date.now();
}

export function StickerField() {
  const pathname = usePathname();
  const fieldRef = useRef<HTMLDivElement>(null);
  const geometryRef = useRef<FieldGeometry | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const placementsRef = useRef<StickerPlacement[]>([]);
  const seedRef = useRef<number | null>(null);
  const [placements, setPlacements] = useState<StickerPlacement[]>([]);
  const [draggingId, setDraggingId] = useState<StickerPlacement["id"] | null>(
    null,
  );

  useEffect(() => {
    if (pathname !== "/") return;

    const field = fieldRef.current;
    if (!field) return;

    bind(field);
    seedRef.current ??= getSeed();
    let frame = 0;
    let active = true;

    const updatePlacements = () => {
      frame = 0;
      if (!active || seedRef.current === null) return;
      const geometry = getFieldGeometry(field);
      const nextPlacements = placeStickers(geometry, seedRef.current);
      geometryRef.current = geometry;
      placementsRef.current = nextPlacements;
      setPlacements(nextPlacements);
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updatePlacements);
    };

    scheduleUpdate();
    void document.fonts.ready.then(scheduleUpdate);

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    const protectedElement = document.querySelector<HTMLElement>(
      "[data-sticker-protected]",
    );
    if (protectedElement) resizeObserver.observe(protectedElement);
    if (field.parentElement) resizeObserver.observe(field.parentElement);

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("load", scheduleUpdate);

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("load", scheduleUpdate);
    };
  }, [
    pathname,
  ]);

  const startDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    const field = fieldRef.current;
    if (!field) return;
    const element = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-sticker]",
    );
    const id = element?.dataset.sticker as StickerPlacement["id"] | undefined;
    const sticker = placementsRef.current.find((item) => item.id === id);
    if (!element || !sticker) return;

    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    geometryRef.current = getFieldGeometry(field);
    dragRef.current = {
      element,
      id: sticker.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: sticker.offsetX,
      startOffsetY: sticker.offsetY,
    };
    setDraggingId(sticker.id);
  }, []);

  const drag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    const geometry = geometryRef.current;
    if (!dragState || !geometry || event.pointerId !== dragState.pointerId) {
      return;
    }

    event.preventDefault();
    const offsetX =
      dragState.startOffsetX + event.clientX - dragState.startClientX;
    const offsetY =
      dragState.startOffsetY + event.clientY - dragState.startClientY;
    setPlacements((current) => {
      const next = moveSticker(
        current,
        dragState.id,
        offsetX,
        offsetY,
        geometry,
      );
      placementsRef.current = next;
      return next;
    });
  }, []);

  const finishDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    dragRef.current = null;
    setDraggingId(null);
    if (dragState.element.hasPointerCapture(event.pointerId)) {
      dragState.element.releasePointerCapture(event.pointerId);
    }
  }, []);

  if (pathname !== "/") return null;

  return (
    <div
      ref={fieldRef}
      className="sticker-field"
      aria-hidden="true"
      data-sticker-field
      onLostPointerCapture={finishDrag}
      onPointerCancel={finishDrag}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={finishDrag}
    >
      {placements.map((sticker) => (
        <div
          key={sticker.id}
          className="sticker"
          data-cuelume-press={sticker.sound}
          data-dragging={draggingId === sticker.id}
          data-sticker={sticker.id}
          style={{
            left: sticker.left,
            top: sticker.top,
            width: sticker.width,
            transform: `translate3d(${sticker.offsetX}px, ${sticker.offsetY}px, 0) rotate(${sticker.rotation}deg)`,
          }}
        >
          <Image
            src={sticker.src}
            alt=""
            width={sticker.width}
            height={sticker.height}
            sizes={`${Math.ceil(sticker.width)}px`}
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
