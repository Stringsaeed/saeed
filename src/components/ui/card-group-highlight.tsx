"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ItemRect } from "@/hooks/use-proximity-hover";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";

// Proximity highlight — a single magnetic layer that springs to the card
// nearest the cursor, previewing where a click will land.
export function CardGroupHighlight({
  className,
  color,
  rect,
  session,
}: {
  className: string;
  color: string | undefined;
  rect: ItemRect | null;
  session: number;
}) {
  return (
    <AnimatePresence>
      {rect && (
        <motion.div
          key={session}
          aria-hidden
          data-slot="card-group-highlight"
          className={cn(
            "absolute pointer-events-none z-0 transition-colors duration-150",
            !color && "bg-hover",
            className,
          )}
          style={{
            backgroundColor: color,
          }}
          initial={{
            opacity: 0,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
          animate={{
            opacity: 1,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
          exit={{
            opacity: 0,
            transition: spring.fast.exit,
          }}
          transition={{
            ...spring.fast,
            opacity: {
              duration: 0.08,
            },
          }}
        />
      )}
    </AnimatePresence>
  );
}
