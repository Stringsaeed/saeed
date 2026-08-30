"use client";

import { useEffect, useRef } from "react";

const GAP = 26;
const INFLUENCE_RADIUS = 132;

export function InteractiveDots() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const context = canvas.getContext("2d");
		if (!context) return;

		const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const finePointerQuery = window.matchMedia("(pointer: fine)");
		let frame = 0;
		let width = 0;
		let height = 0;
		let pointerX = -INFLUENCE_RADIUS * 2;
		let pointerY = -INFLUENCE_RADIUS * 2;
		let targetX = pointerX;
		let targetY = pointerY;

		const draw = () => {
			const styles = getComputedStyle(canvas);
			const dotColor = styles.getPropertyValue("--dot-color").trim();
			const activeDotColor = styles
				.getPropertyValue("--dot-active-color")
				.trim();

			context.clearRect(0, 0, width, height);

			for (let y = GAP / 2; y < height; y += GAP) {
				for (let x = GAP / 2; x < width; x += GAP) {
					const deltaX = x - pointerX;
					const deltaY = y - pointerY;
					const distance = Math.hypot(deltaX, deltaY);
					const influence = motionQuery.matches
						? 0
						: Math.max(0, 1 - distance / INFLUENCE_RADIUS);
					const offset = influence * influence * 10;
					const directionX = distance > 0 ? deltaX / distance : 0;
					const directionY = distance > 0 ? deltaY / distance : 0;

					context.beginPath();
					context.fillStyle = influence > 0.03 ? activeDotColor : dotColor;
					context.arc(
						x + directionX * offset,
						y + directionY * offset,
						0.85 + influence * 1.25,
						0,
						Math.PI * 2,
					);
					context.fill();
				}
			}
		};
		const themeObserver = new MutationObserver(draw);

		const animate = () => {
			pointerX += (targetX - pointerX) * 0.18;
			pointerY += (targetY - pointerY) * 0.18;
			draw();

			if (
				Math.abs(targetX - pointerX) > 0.1 ||
				Math.abs(targetY - pointerY) > 0.1
			) {
				frame = requestAnimationFrame(animate);
			} else {
				frame = 0;
			}
		};

		const queueFrame = () => {
			if (frame === 0) frame = requestAnimationFrame(animate);
		};

		const resize = () => {
			const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = Math.round(width * pixelRatio);
			canvas.height = Math.round(height * pixelRatio);
			context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
			draw();
		};

		const handlePointerMove = (event: PointerEvent) => {
			if (motionQuery.matches || !finePointerQuery.matches) return;
			targetX = event.clientX;
			targetY = event.clientY;
			queueFrame();
		};

		const resetPointer = () => {
			targetX = -INFLUENCE_RADIUS * 2;
			targetY = -INFLUENCE_RADIUS * 2;
			queueFrame();
		};

		resize();
		window.addEventListener("resize", resize);
		window.addEventListener("pointermove", handlePointerMove, {
			passive: true,
		});
		window.addEventListener("blur", resetPointer);
		document.documentElement.addEventListener("mouseleave", resetPointer);
		motionQuery.addEventListener("change", resetPointer);
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: [
				"class",
			],
		});

		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("resize", resize);
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("blur", resetPointer);
			document.documentElement.removeEventListener("mouseleave", resetPointer);
			motionQuery.removeEventListener("change", resetPointer);
			themeObserver.disconnect();
		};
	}, []);

	return (
		<div
			className="interactive-dots pointer-events-none fixed inset-0 -z-10"
			aria-hidden="true"
		>
			<canvas ref={canvasRef} className="size-full" />
		</div>
	);
}
