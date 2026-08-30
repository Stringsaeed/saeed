export const supportedRepresentations = [
	"text/html",
	"text/markdown",
] as const;

export type SupportedRepresentation = (typeof supportedRepresentations)[number];

type AcceptEntry = {
	type: string;
	quality: number;
	specificity: number;
	position: number;
};

function getSpecificity(type: string) {
	if (type === "*/*") return 0;
	if (type.endsWith("/*")) return 1;
	return 2;
}

export function parseAccept(header: string): AcceptEntry[] {
	return header
		.split(",")
		.map((raw, position) => {
			const parts = raw
				.trim()
				.split(";")
				.map((part) => part.trim());
			const type = parts.shift()?.toLowerCase() ?? "";
			const qualityParameter = parts.find((part) =>
				part.toLowerCase().startsWith("q="),
			);
			const parsedQuality = qualityParameter
				? Number(qualityParameter.slice(2))
				: 1;
			const quality = Number.isFinite(parsedQuality)
				? Math.min(1, Math.max(0, parsedQuality))
				: 0;

			return {
				type,
				quality,
				specificity: getSpecificity(type),
				position,
			};
		})
		.filter((entry) => /^([^/\s]+)\/([^/\s]+)$/.test(entry.type));
}

function matches(entry: AcceptEntry, candidate: SupportedRepresentation) {
	if (entry.type === "*/*") return true;
	const [entryType, entrySubtype] = entry.type.split("/");
	const [candidateType, candidateSubtype] = candidate.split("/");

	return (
		entryType === candidateType &&
		(entrySubtype === "*" || entrySubtype === candidateSubtype)
	);
}

export function preferredRepresentation(
	header: string | null,
): SupportedRepresentation | null {
	if (!header?.trim()) return supportedRepresentations[0];

	const entries = parseAccept(header);
	if (entries.length === 0) return supportedRepresentations[0];

	let bestType: SupportedRepresentation | null = null;
	let bestQuality = -1;
	let bestPosition = Number.POSITIVE_INFINITY;

	for (const candidate of supportedRepresentations) {
		let matched: AcceptEntry | null = null;

		for (const entry of entries) {
			if (!matches(entry, candidate)) continue;
			if (
				matched === null ||
				entry.specificity > matched.specificity ||
				(entry.specificity === matched.specificity &&
					entry.position < matched.position)
			) {
				matched = entry;
			}
		}

		if (!matched || matched.quality <= 0) continue;

		if (
			matched.quality > bestQuality ||
			(matched.quality === bestQuality && matched.position < bestPosition)
		) {
			bestType = candidate;
			bestQuality = matched.quality;
			bestPosition = matched.position;
		}
	}

	return bestType;
}

export function appendVaryAccept(headers: Headers) {
	const current = headers.get("Vary");
	if (!current) {
		headers.set("Vary", "Accept");
		return;
	}

	const values = current.split(",").map((value) => value.trim().toLowerCase());
	if (!values.includes("accept")) headers.set("Vary", `${current}, Accept`);
}
