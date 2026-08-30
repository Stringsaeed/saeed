import { readFile } from "node:fs/promises";
import { join } from "node:path";

const logoBase64 = await readFile(
	join(process.cwd(), "public/static/color.svg"),
	"base64",
);

export const ogLogoSrc = `data:image/svg+xml;base64,${logoBase64}`;
