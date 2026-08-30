"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const avatars = [
	"/static/color.svg",
	"/static/dark.svg",
	"/static/solid.svg",
	"/static/solid-blue.svg",
	"/static/line.svg",
	"/static/line-blue.svg",
];

const interval = 3000;

export function AnimatedAvatar() {
	const [activeIndex, setActiveIndex] = useState(0);

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

	return (
		<span
			className="relative size-8 shrink-0 overflow-hidden rounded-full"
			aria-hidden="true"
		>
			{avatars.map((src, index) => (
				<Image
					key={src}
					src={src}
					alt=""
					width={32}
					height={32}
					className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
						index === activeIndex ? "opacity-100" : "opacity-0"
					}`}
					priority={index === 0}
				/>
			))}
		</span>
	);
}
