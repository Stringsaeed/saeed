"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { onIdle } from "@/lib/idle";

// `pupil` is the eye colour drawn on top of each SVG; the PNG has no eye.
const avatars = [
	{ src: "/static/color.svg", pupil: "black" },
	{ src: "/static/dark.svg", pupil: "black" },
	{ src: "/static/solid.svg", pupil: "black" },
	{ src: "/static/solid-blue.svg", pupil: "#0066FF" },
	{ src: "/static/line.svg", pupil: "black" },
	{ src: "/static/line-blue.svg", pupil: "#0066FF" },
	{ src: "/static/hash.png", pupil: null },
];

const interval = 3000;

// Pupil geometry in the SVGs' 90×90 viewBox.
const viewBoxSize = 90;
const eye = { x: 26.6849, y: 33.9117 };
// How far the pupil may travel inside the glasses lens, in viewBox units.
const maxOffset = { x: 1.5, y: 1.6 };
// Cursor distance (px) at which the pupil reaches its full offset.
const reach = 240;

export function AnimatedAvatar() {
	const [activeIndex, setActiveIndex] = useState(0);
	// Only the first face shows at load; the rest arrive once the page
	// settles, well before the first swap.
	const [allFaces, setAllFaces] = useState(false);
	const containerRef = useRef<HTMLSpanElement>(null);

	useEffect(() => onIdle(() => setAllFaces(true)), []);

	useEffect(() => {
		const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		let intervalId: ReturnType<typeof setInterval> | undefined;

		const stop = () => {
			if (intervalId) clearInterval(intervalId);
			intervalId = undefined;
		};

		const start = () => {
			stop();
			if (motionQuery.matches || document.hidden) {
				if (motionQuery.matches) setActiveIndex(0);
				return;
			}

			intervalId = setInterval(() => {
				setActiveIndex((current) => (current + 1) % avatars.length);
			}, interval);
		};

		start();
		motionQuery.addEventListener("change", start);
		document.addEventListener("visibilitychange", start);

		return () => {
			stop();
			motionQuery.removeEventListener("change", start);
			document.removeEventListener("visibilitychange", start);
		};
	}, []);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		let frame = 0;
		let pointer: { x: number; y: number } | undefined;

		const setOffset = (x: number, y: number) => {
			container.style.setProperty("--pupil-x", `${x}px`);
			container.style.setProperty("--pupil-y", `${y}px`);
		};

		const update = () => {
			frame = 0;
			if (!pointer) return;

			const rect = container.getBoundingClientRect();
			const dx = pointer.x - (rect.left + (eye.x / viewBoxSize) * rect.width);
			const dy = pointer.y - (rect.top + (eye.y / viewBoxSize) * rect.height);
			const distance = Math.hypot(dx, dy);
			if (distance === 0) return setOffset(0, 0);

			const strength = Math.min(distance / reach, 1);
			setOffset(
				(dx / distance) * strength * maxOffset.x,
				(dy / distance) * strength * maxOffset.y,
			);
		};

		const onPointerMove = (event: PointerEvent) => {
			pointer = { x: event.clientX, y: event.clientY };
			if (!frame) frame = requestAnimationFrame(update);
		};

		const onPointerLeave = () => {
			pointer = undefined;
			setOffset(0, 0);
		};

		const track = () => {
			window.removeEventListener("pointermove", onPointerMove);
			document.documentElement.removeEventListener(
				"pointerleave",
				onPointerLeave,
			);
			onPointerLeave();
			if (motionQuery.matches) return;

			window.addEventListener("pointermove", onPointerMove, { passive: true });
			document.documentElement.addEventListener("pointerleave", onPointerLeave);
		};

		track();
		motionQuery.addEventListener("change", track);

		return () => {
			cancelAnimationFrame(frame);
			motionQuery.removeEventListener("change", track);
			window.removeEventListener("pointermove", onPointerMove);
			document.documentElement.removeEventListener(
				"pointerleave",
				onPointerLeave,
			);
		};
	}, []);

	return (
		<span
			ref={containerRef}
			className="relative size-8 shrink-0 overflow-hidden rounded-full"
			aria-hidden="true"
		>
			{avatars.map(({ src, pupil }, index) => (
				<span
					key={src}
					className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
						index === activeIndex ? "opacity-100" : "opacity-0"
					}`}
				>
					{index === 0 || allFaces ? (
						<Image
							src={src}
							alt=""
							width={32}
							height={32}
							className="absolute inset-0"
							priority={index === 0}
						/>
					) : null}
					{pupil ? (
						<svg
							aria-hidden="true"
							viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
							className="absolute inset-0 size-full"
						>
							<g
								className="transition-transform duration-150 ease-out motion-reduce:transition-none"
								style={{
									transform:
										"translate(var(--pupil-x, 0px), var(--pupil-y, 0px))",
								}}
							>
								<ellipse
									cx={eye.x}
									cy={eye.y}
									rx="1.23193"
									ry="2.21875"
									transform={`rotate(-11.6788 ${eye.x} ${eye.y})`}
									fill={pupil}
								/>
							</g>
						</svg>
					) : null}
				</span>
			))}
		</span>
	);
}
