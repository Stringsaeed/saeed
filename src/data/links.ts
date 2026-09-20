import { assertHttpsUrl } from "@/lib/https-url";
import stored from "./links.json";

export type LinkEntry = {
  website: string;
  type: string;
  url: string;
  description: string;
};

function readLinks(): readonly LinkEntry[] {
  return stored.links.map((entry, index) => {
    if (
      typeof entry.website !== "string" ||
      entry.website.trim() === "" ||
      typeof entry.type !== "string" ||
      entry.type.trim() === "" ||
      typeof entry.description !== "string" ||
      typeof entry.url !== "string"
    ) {
      throw new Error(`Link ${index + 1} is missing a field.`);
    }

    return {
      website: entry.website,
      type: entry.type,
      url: assertHttpsUrl(entry.url),
      description: entry.description,
    };
  });
}

export const links = readLinks();
