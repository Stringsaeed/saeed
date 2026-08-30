"use client";

import { track } from "@vercel/analytics";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const viewedElements = new WeakSet<Element>();

const propertyKeys = {
	analyticsCompany: "company",
	analyticsDestination: "destination",
	analyticsLabel: "label",
	analyticsLocation: "location",
	analyticsNetwork: "network",
	analyticsSlug: "slug",
	analyticsType: "type",
} as const;

function propertiesFrom(element: HTMLElement) {
	const properties: Record<string, string> = {};

	for (const [datasetKey, propertyKey] of Object.entries(propertyKeys)) {
		const value = element.dataset[datasetKey];
		if (value) properties[propertyKey] = value;
	}

	return properties;
}

function articleLinkProperties(anchor: HTMLAnchorElement) {
	const article = anchor.closest<HTMLElement>("[data-analytics-article]");
	const href = anchor.getAttribute("href");
	if (!article || !href) return null;

	let destination = href;
	try {
		const url = new URL(anchor.href);
		destination =
			url.origin === window.location.origin ? url.pathname : url.hostname;
	} catch {
		// Keep the original href for non-HTTP links.
	}

	return {
		destination,
		slug: article.dataset.analyticsSlug ?? "unknown",
	};
}

function RouteAnalyticsEvents() {
	useEffect(() => {
		const handleClick = (event: MouseEvent) => {
			if (!(event.target instanceof Element)) return;

			const trackedElement = event.target.closest<HTMLElement>(
				"[data-analytics-event]",
			);

			if (trackedElement?.dataset.analyticsEvent) {
				track(
					trackedElement.dataset.analyticsEvent,
					propertiesFrom(trackedElement),
				);
				return;
			}

			const articleLink = event.target.closest<HTMLAnchorElement>(
				"[data-analytics-article] a",
			);
			const properties = articleLink
				? articleLinkProperties(articleLink)
				: null;
			if (properties) track("Article Link Clicked", properties);
		};

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting || viewedElements.has(entry.target))
						continue;

					const element = entry.target as HTMLElement;
					const eventName = element.dataset.analyticsView;
					if (!eventName) continue;

					viewedElements.add(element);
					track(eventName, propertiesFrom(element));
					observer.unobserve(element);
				}
			},
			{
				threshold: 0.5,
			},
		);

		document.addEventListener("click", handleClick, true);
		for (const element of document.querySelectorAll<HTMLElement>(
			"[data-analytics-view]",
		)) {
			observer.observe(element);
		}

		return () => {
			document.removeEventListener("click", handleClick, true);
			observer.disconnect();
		};
	}, []);

	return null;
}

export function AnalyticsEvents() {
	const pathname = usePathname();
	return <RouteAnalyticsEvents key={pathname} />;
}
