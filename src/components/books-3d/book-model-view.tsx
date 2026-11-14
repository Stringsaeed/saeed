"use client";

import { type MotionValue, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useBlueprint } from "@/lib/blueprint";
import {
  type BlueprintMeshPalette,
  blueprintMeshPalette,
} from "@/lib/blueprint-palette";
import type { BookModel } from "@/lib/books-3d/types";
import type { BookLibrary } from "@/lib/books-3d/viewer";

type Viewer = ReturnType<BookLibrary["attach"]>;
type Props = {
  model: BookModel;
  getLibrary: () => Promise<BookLibrary>;
  fallback: string;
  width: number;
  height: number;
  perspective: number;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  onReady: () => void;
};

export function BookModelView({
  model,
  getLibrary,
  fallback,
  width,
  height,
  perspective,
  rotateX,
  rotateY,
  onReady,
}: Props) {
  const blueprint = useBlueprint();
  const { resolvedTheme } = useTheme();
  const palette = useMemo<BlueprintMeshPalette | null>(() => {
    return blueprintMeshPalette(blueprint, resolvedTheme);
  }, [
    blueprint,
    resolvedTheme,
  ]);
  const paletteRef = useRef(palette);

  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [failed, setFailed] = useState(false);
  const dimensions = useRef({
    width,
    height,
    perspective,
  });
  useEffect(() => {
    dimensions.current = {
      width,
      height,
      perspective,
    };
    viewer.current?.resize(dimensions.current);
  }, [
    width,
    height,
    perspective,
  ]);
  useLayoutEffect(() => {
    paletteRef.current = palette;
    viewer.current?.setBlueprint(palette);
  }, [
    palette,
  ]);
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let instance: Viewer | null = null;
    const update = () => instance?.pose(rotateX.get(), rotateY.get());
    const stopX = rotateX.on("change", update),
      stopY = rotateY.on("change", update);
    getLibrary()
      .then(async (library) => {
        if (cancelled) return;
        instance = library.attach(
          element,
          model,
          dimensions.current,
          paletteRef.current,
        );
        viewer.current = instance;
        update();
        await instance.ready;
        if (!cancelled) onReady();
      })
      .catch(() => {
        instance?.dispose();
        if (viewer.current === instance) viewer.current = null;
        if (!cancelled) {
          setFailed(true);
          onReady();
        }
      });
    return () => {
      cancelled = true;
      stopX();
      stopY();
      instance?.dispose();
      if (viewer.current === instance) viewer.current = null;
    };
  }, [
    getLibrary,
    model,
    rotateX,
    rotateY,
    onReady,
  ]);

  return (
    <>
      <div
        ref={host}
        data-book-model={model.id}
        style={{
          position: "absolute",
          width: "200%",
          height: "160%",
          left: "-50%",
          top: "-30%",
          pointerEvents: "none",
        }}
      />
      {failed && (
        <motion.img
          src={fallback}
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "fill",
            rotateX,
            rotateY,
          }}
        />
      )}
    </>
  );
}
