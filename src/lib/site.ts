const canonicalOrigin = "https://thisissaeed.com";

export const siteName = "Muhammed Saeed";
export const siteAlternateNames = [
	"Saeed",
	"Stringsaeed",
	"This is Saeed",
];
export const siteDescription =
	"Muhammed Saeed is a software engineer in Dubai working on React Native, TypeScript, performance, accessibility, native code, and agent-assisted engineering.";

export const socialProfiles = [
	"https://github.com/stringsaeed",
	"https://linkedin.com/in/stringsaeed",
	"https://x.com/stringsaeed",
	"https://bsky.app/profile/saeed.guru",
];

function parseOrigin(value: string, source: string) {
	const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`;
	let url: URL;

	try {
		url = new URL(withProtocol);
	} catch {
		throw new Error(`${source} must be a valid domain or absolute URL.`);
	}

	if (
		![
			"http:",
			"https:",
		].includes(url.protocol)
	) {
		throw new Error(`${source} must use the http or https protocol.`);
	}

	if (url.pathname !== "/" || url.search || url.hash) {
		throw new Error(
			`${source} must be a domain without a path, query, or hash.`,
		);
	}

	return url.origin;
}

export function getSiteOrigin() {
	const publicOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
	if (publicOrigin) {
		return parseOrigin(publicOrigin, "NEXT_PUBLIC_SITE_URL");
	}

	return canonicalOrigin;
}

export function getAbsoluteUrl(path = "/") {
	return new URL(path, `${getSiteOrigin()}/`).toString();
}
