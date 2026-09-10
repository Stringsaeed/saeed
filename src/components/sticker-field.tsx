"use client";

import { bind } from "cuelume";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { STICKERS, type StickerDefinition } from "./sticker-data";

type Rectangle = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type StickerPlacement = StickerDefinition & {
  left: number;
  offsetX: number;
  offsetY: number;
  scale: number;
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
  lastClientX: number;
  lastClientY: number;
  lastTime: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
  velocityX: number;
  velocityY: number;
  moved: boolean;
};

type InertiaState = {
  frame: number;
  id: StickerPlacement["id"];
  lastTimestamp: number;
  velocityX: number;
  velocityY: number;
};

type PointerPosition = {
  clientX: number;
  clientY: number;
  id: StickerPlacement["id"];
};

type TransformGestureState = {
  id: StickerPlacement["id"];
  pointerIds: [
    number,
    number,
  ];
  startAngle: number;
  startDistance: number;
  startRotation: number;
  startScale: number;
};

const MINIMUM_VIEWPORT_WIDTH = 960;
const EDGE_PADDING = 24;
const CONTENT_CLEARANCE = 18;
const STICKER_CLEARANCE = 22;
const PLACEMENT_ATTEMPTS = 80;
const DRAG_THRESHOLD = 8;
const VELOCITY_SMOOTHING = 0.4;
const MAX_RELEASE_VELOCITY = 1.25;
const RELEASE_IDLE_CUTOFF = 80;
const DECAY_TIME_CONSTANT = 280;
const MAX_FRAME_DURATION = 32;
const STOP_VELOCITY = 0.015;
const MIN_STICKER_SCALE = 0.8;
const MAX_STICKER_SCALE = 1.8;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function angleBetween(first: PointerPosition, second: PointerPosition) {
  return Math.atan2(
    second.clientY - first.clientY,
    second.clientX - first.clientX,
  );
}

function distanceBetween(first: PointerPosition, second: PointerPosition) {
  return Math.hypot(
    second.clientX - first.clientX,
    second.clientY - first.clientY,
  );
}

function normalizeDegrees(degrees: number) {
  return ((((degrees + 180) % 360) + 360) % 360) - 180;
}

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
  const bounds = rotatedSize(
    sticker.width * sticker.scale,
    sticker.height * sticker.scale,
    sticker.rotation,
  );
  const centerX = sticker.left + sticker.offsetX + sticker.width / 2;
  const centerY = sticker.top + sticker.offsetY + sticker.height / 2;

  return {
    left: centerX - bounds.width / 2,
    top: centerY - bounds.height / 2,
    right: centerX + bounds.width / 2,
    bottom: centerY + bounds.height / 2,
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

function transformSticker(
  placements: StickerPlacement[],
  id: StickerPlacement["id"],
  scale: number,
  rotation: number,
  geometry: FieldGeometry,
) {
  const index = placements.findIndex((sticker) => sticker.id === id);
  const current = placements[index];
  if (!current) return placements;

  const transformed = {
    ...current,
    scale,
    rotation,
  };
  if (isPlacementValid(transformed, placements, geometry)) {
    return placements.map((sticker, stickerIndex) =>
      stickerIndex === index ? transformed : sticker,
    );
  }

  let next = current;
  const scaled = {
    ...next,
    scale,
  };
  if (isPlacementValid(scaled, placements, geometry)) next = scaled;

  const rotated = {
    ...next,
    rotation,
  };
  if (isPlacementValid(rotated, placements, geometry)) next = rotated;

  if (next === current) return placements;

  return placements.map((sticker, stickerIndex) =>
    stickerIndex === index ? next : sticker,
  );
}

function placeStickers(geometry: FieldGeometry, seed: number) {
  if (geometry.width < MINIMUM_VIEWPORT_WIDTH) return [];

  if (geometry.protectedRectangles.length === 0) return [];

  const protectedColumn = geometry.protectedRectangles.reduce(
    (column, rectangle) => ({
      left: Math.min(column.left, rectangle.left),
      top: Math.min(column.top, rectangle.top),
      right: Math.max(column.right, rectangle.right),
      bottom: Math.max(column.bottom, rectangle.bottom),
    }),
  );

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
          scale: 1,
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

function getPathSeed(pathname: string) {
  let value = 2166136261;

  for (let index = 0; index < pathname.length; index += 1) {
    value = Math.imul(value ^ pathname.charCodeAt(index), 16777619);
  }

  return value >>> 0;
}

export function StickerField() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const fieldRef = useRef<HTMLDivElement>(null);
  const geometryRef = useRef<FieldGeometry | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const inertiaRef = useRef<InertiaState | null>(null);
  const pointersRef = useRef(new Map<number, PointerPosition>());
  const transformGestureRef = useRef<TransformGestureState | null>(null);
  const placementsRef = useRef<StickerPlacement[]>([]);
  const seedRef = useRef<number | null>(null);
  const [placements, setPlacements] = useState<StickerPlacement[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<
    StickerPlacement["id"] | null
  >(null);
  const [draggingId, setDraggingId] = useState<StickerPlacement["id"] | null>(
    null,
  );

  const cancelInertia = useCallback(() => {
    const inertia = inertiaRef.current;
    if (!inertia) return;
    cancelAnimationFrame(inertia.frame);
    inertiaRef.current = null;
  }, []);

  const startInertia = useCallback(
    (
      id: StickerPlacement["id"],
      releaseVelocityX: number,
      releaseVelocityY: number,
    ) => {
      cancelInertia();
      if (reduceMotion) return;

      const velocityX = clamp(
        releaseVelocityX,
        -MAX_RELEASE_VELOCITY,
        MAX_RELEASE_VELOCITY,
      );
      const velocityY = clamp(
        releaseVelocityY,
        -MAX_RELEASE_VELOCITY,
        MAX_RELEASE_VELOCITY,
      );
      if (Math.hypot(velocityX, velocityY) <= STOP_VELOCITY) return;

      const tick = (timestamp: number) => {
        const inertia = inertiaRef.current;
        const geometry = geometryRef.current;
        if (!inertia || inertia.id !== id || !geometry) return;

        const elapsed = Math.min(
          timestamp - inertia.lastTimestamp,
          MAX_FRAME_DURATION,
        );
        inertia.lastTimestamp = timestamp;
        const decay = Math.exp(-elapsed / DECAY_TIME_CONSTANT);
        inertia.velocityX *= decay;
        inertia.velocityY *= decay;

        const current = placementsRef.current;
        const before = current.find((sticker) => sticker.id === id);
        if (!before) {
          cancelInertia();
          return;
        }

        const next = moveSticker(
          current,
          id,
          before.offsetX + inertia.velocityX * elapsed,
          before.offsetY + inertia.velocityY * elapsed,
          geometry,
        );
        const after = next.find((sticker) => sticker.id === id);
        if (!after) {
          cancelInertia();
          return;
        }

        if (after.offsetX === before.offsetX) inertia.velocityX = 0;
        if (after.offsetY === before.offsetY) inertia.velocityY = 0;

        placementsRef.current = next;
        setPlacements(next);

        if (Math.hypot(inertia.velocityX, inertia.velocityY) <= STOP_VELOCITY) {
          inertiaRef.current = null;
          return;
        }

        inertia.frame = requestAnimationFrame(tick);
      };

      inertiaRef.current = {
        frame: requestAnimationFrame(tick),
        id,
        lastTimestamp: performance.now(),
        velocityX,
        velocityY,
      };
    },
    [
      cancelInertia,
      reduceMotion,
    ],
  );

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    bind(field);
    seedRef.current ??= getSeed();
    const routeSeed = seedRef.current ^ getPathSeed(pathname);
    let frame = 0;
    let active = true;

    const updatePlacements = () => {
      frame = 0;
      if (!active || seedRef.current === null) return;
      const geometry = getFieldGeometry(field);
      const nextPlacements = placeStickers(geometry, routeSeed);
      geometryRef.current = geometry;
      placementsRef.current = nextPlacements;
      setPlacements(nextPlacements);
    };
    const scheduleUpdate = () => {
      cancelInertia();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updatePlacements);
    };

    updatePlacements();
    void document.fonts.ready.then(scheduleUpdate);

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    const protectedElements = document.querySelectorAll<HTMLElement>(
      "[data-sticker-protected]",
    );
    for (const protectedElement of protectedElements) {
      resizeObserver.observe(protectedElement);
    }
    if (field.parentElement) resizeObserver.observe(field.parentElement);

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("load", scheduleUpdate);

    return () => {
      active = false;
      cancelInertia();
      pointersRef.current.clear();
      transformGestureRef.current = null;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("load", scheduleUpdate);
    };
  }, [
    cancelInertia,
    pathname,
  ]);

  useEffect(() => {
    if (!activeStoryId) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveStoryId(null);
    };
    const closeOutsideSticker = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(`[data-sticker="${activeStoryId}"]`)
      ) {
        return;
      }
      setActiveStoryId(null);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutsideSticker, true);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutsideSticker, true);
    };
  }, [
    activeStoryId,
  ]);

  const toggleStory = useCallback((id: StickerPlacement["id"]) => {
    setActiveStoryId((current) => (current === id ? null : id));
  }, []);

  const toggleStoryFromKeyboard = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (event.detail !== 0) return;
      const element =
        event.currentTarget.closest<HTMLElement>("[data-sticker]");
      const id = element?.dataset.sticker as StickerPlacement["id"] | undefined;
      if (!id) return;
      toggleStory(id);
    },
    [
      toggleStory,
    ],
  );

  const startPointerInteraction = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
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

      const pointers = pointersRef.current;
      const currentDrag = dragRef.current;
      if (
        pointers.has(event.pointerId) ||
        pointers.size >= 2 ||
        (currentDrag && currentDrag.id !== sticker.id)
      ) {
        return;
      }

      cancelInertia();
      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      geometryRef.current = getFieldGeometry(field);
      pointers.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
        id: sticker.id,
      });

      if (currentDrag) {
        const firstPointer = pointers.get(currentDrag.pointerId);
        const secondPointer = pointers.get(event.pointerId);
        if (!firstPointer || !secondPointer) {
          pointers.delete(event.pointerId);
          if (element.hasPointerCapture(event.pointerId)) {
            element.releasePointerCapture(event.pointerId);
          }
          return;
        }

        const startDistance = distanceBetween(firstPointer, secondPointer);
        if (startDistance === 0) {
          pointers.delete(event.pointerId);
          if (element.hasPointerCapture(event.pointerId)) {
            element.releasePointerCapture(event.pointerId);
          }
          return;
        }

        currentDrag.moved = true;
        transformGestureRef.current = {
          id: sticker.id,
          pointerIds: [
            currentDrag.pointerId,
            event.pointerId,
          ],
          startAngle: angleBetween(firstPointer, secondPointer),
          startDistance,
          startRotation: sticker.rotation,
          startScale: sticker.scale,
        };
        setDraggingId(sticker.id);
        setActiveStoryId((current) =>
          current === sticker.id ? null : current,
        );
        return;
      }

      dragRef.current = {
        element,
        id: sticker.id,
        lastClientX: event.clientX,
        lastClientY: event.clientY,
        lastTime: event.timeStamp,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startOffsetX: sticker.offsetX,
        startOffsetY: sticker.offsetY,
        velocityX: 0,
        velocityY: 0,
        moved: false,
      };
    },
    [
      cancelInertia,
    ],
  );

  const updatePointerInteraction = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const pointer = pointersRef.current.get(event.pointerId);
      if (!pointer) return;

      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;

      const transformGesture = transformGestureRef.current;
      const geometry = geometryRef.current;
      if (
        transformGesture &&
        geometry &&
        transformGesture.pointerIds.includes(event.pointerId)
      ) {
        event.preventDefault();
        const firstPointer = pointersRef.current.get(
          transformGesture.pointerIds[0],
        );
        const secondPointer = pointersRef.current.get(
          transformGesture.pointerIds[1],
        );
        if (!firstPointer || !secondPointer) return;

        const scale = clamp(
          transformGesture.startScale *
            (distanceBetween(firstPointer, secondPointer) /
              transformGesture.startDistance),
          MIN_STICKER_SCALE,
          MAX_STICKER_SCALE,
        );
        const rotation = normalizeDegrees(
          transformGesture.startRotation +
            ((angleBetween(firstPointer, secondPointer) -
              transformGesture.startAngle) *
              180) /
              Math.PI,
        );
        const next = transformSticker(
          placementsRef.current,
          transformGesture.id,
          scale,
          rotation,
          geometry,
        );
        placementsRef.current = next;
        setPlacements(next);
        return;
      }

      const dragState = dragRef.current;
      if (!dragState || !geometry || event.pointerId !== dragState.pointerId) {
        return;
      }

      event.preventDefault();
      const elapsed = event.timeStamp - dragState.lastTime;
      if (elapsed > 0) {
        const velocityX = (event.clientX - dragState.lastClientX) / elapsed;
        const velocityY = (event.clientY - dragState.lastClientY) / elapsed;
        dragState.velocityX +=
          (velocityX - dragState.velocityX) * VELOCITY_SMOOTHING;
        dragState.velocityY +=
          (velocityY - dragState.velocityY) * VELOCITY_SMOOTHING;
        dragState.lastClientX = event.clientX;
        dragState.lastClientY = event.clientY;
        dragState.lastTime = event.timeStamp;
      }

      const distance = Math.hypot(
        event.clientX - dragState.startClientX,
        event.clientY - dragState.startClientY,
      );
      if (!dragState.moved && distance < DRAG_THRESHOLD) return;

      if (!dragState.moved) {
        dragState.moved = true;
        setDraggingId(dragState.id);
        setActiveStoryId((current) =>
          current === dragState.id ? null : current,
        );
      }
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
    },
    [],
  );

  const finishPointerInteraction = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const pointer = pointersRef.current.get(event.pointerId);
      if (!pointer) return;

      pointersRef.current.delete(event.pointerId);
      const transformGesture = transformGestureRef.current;
      if (transformGesture?.pointerIds.includes(event.pointerId)) {
        transformGestureRef.current = null;
        const element = dragRef.current?.element;
        if (element?.hasPointerCapture(event.pointerId)) {
          element.releasePointerCapture(event.pointerId);
        }

        const remainingPointerId = transformGesture.pointerIds.find(
          (pointerId) => pointerId !== event.pointerId,
        );
        const remainingPointer =
          remainingPointerId === undefined
            ? undefined
            : pointersRef.current.get(remainingPointerId);
        const sticker = placementsRef.current.find(
          (placement) => placement.id === transformGesture.id,
        );
        if (
          element &&
          remainingPointerId !== undefined &&
          remainingPointer &&
          sticker
        ) {
          dragRef.current = {
            element,
            id: sticker.id,
            lastClientX: remainingPointer.clientX,
            lastClientY: remainingPointer.clientY,
            lastTime: event.timeStamp,
            pointerId: remainingPointerId,
            startClientX: remainingPointer.clientX,
            startClientY: remainingPointer.clientY,
            startOffsetX: sticker.offsetX,
            startOffsetY: sticker.offsetY,
            velocityX: 0,
            velocityY: 0,
            moved: true,
          };
          setDraggingId(sticker.id);
        } else {
          dragRef.current = null;
          setDraggingId(null);
        }
        return;
      }

      const dragState = dragRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;

      const shouldToggleStory = event.type === "pointerup" && !dragState.moved;
      dragRef.current = null;
      setDraggingId(null);
      if (dragState.element.hasPointerCapture(event.pointerId)) {
        dragState.element.releasePointerCapture(event.pointerId);
      }
      if (shouldToggleStory) toggleStory(dragState.id);
      const releasedRecently =
        event.timeStamp - dragState.lastTime <= RELEASE_IDLE_CUTOFF;
      if (event.type === "pointerup" && dragState.moved && releasedRecently) {
        startInertia(dragState.id, dragState.velocityX, dragState.velocityY);
      }
    },
    [
      startInertia,
      toggleStory,
    ],
  );

  return (
    <div
      ref={fieldRef}
      className={cn("sticker-field", activeStoryId && "z-20")}
      data-story-open={activeStoryId !== null}
      data-sticker-field
      onLostPointerCapture={finishPointerInteraction}
      onPointerCancel={finishPointerInteraction}
      onPointerDown={startPointerInteraction}
      onPointerMove={updatePointerInteraction}
      onPointerUp={finishPointerInteraction}
    >
      {placements.map((sticker) => (
        <div
          key={sticker.id}
          className={cn(
            "sticker",
            activeStoryId === sticker.id && "z-10 opacity-100 drop-shadow-xl",
          )}
          data-cuelume-press={sticker.sound}
          data-dragging={draggingId === sticker.id}
          data-sticker={sticker.id}
          style={{
            left: sticker.left,
            top: sticker.top,
            width: sticker.width,
            transform: `translate3d(${sticker.offsetX}px, ${sticker.offsetY}px, 0) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
          }}
        >
          <Tooltip
            forceOpen={activeStoryId === sticker.id}
            side={sticker.top + sticker.offsetY < 260 ? "bottom" : "top"}
            sideOffset={16}
            className="w-76 rounded-4xl bg-popover p-5 text-popover-foreground shadow-surface-6"
            content={
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  {sticker.label}
                </p>
                <p className="text-[15px] leading-6 font-normal text-pretty">
                  {sticker.story}
                </p>
              </div>
            }
          >
            <button
              type="button"
              className="group/sticker block w-full cursor-[inherit] appearance-none border-0 bg-transparent p-0 text-inherit focus-visible:rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-ring"
              aria-label={`${activeStoryId === sticker.id ? "Close" : "Open"} ${sticker.label.toLowerCase()} sticker story`}
              onClick={toggleStoryFromKeyboard}
            >
              <Image
                src={sticker.src}
                alt=""
                width={sticker.width}
                height={sticker.height}
                sizes={`${Math.ceil(sticker.width)}px`}
                loading="eager"
                className="block h-auto w-full transition-transform duration-150 ease-out group-active/sticker:scale-96"
                draggable={false}
              />
            </button>
          </Tooltip>
        </div>
      ))}
      <AnimatePresence initial={false}>
        {activeStoryId ? (
          <motion.div
            key="sticker-backdrop"
            className="pointer-events-auto absolute inset-0 z-0 bg-background/70 backdrop-blur-sm"
            aria-hidden="true"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
              ease: [
                0.23,
                1,
                0.32,
                1,
              ],
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
