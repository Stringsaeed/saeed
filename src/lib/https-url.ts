const forbiddenProtocols = [
  "javascript:",
  "data:",
  "vbscript:",
];

export const httpsUrlPattern = /^https:\/\/\S+$/i;

function stripControlCharacters(value: string) {
  let result = "";
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
      continue;
    }
    result += character;
  }
  return result;
}

export function isHttpsUrl(value: string): boolean {
  if (value !== value.trim() || !httpsUrlPattern.test(value)) {
    return false;
  }

  const stripped = stripControlCharacters(value);
  if (stripped !== value) {
    return false;
  }

  const lower = stripped.toLowerCase();
  if (forbiddenProtocols.some((protocol) => lower.startsWith(protocol))) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export function assertHttpsUrl(value: string): string {
  if (!isHttpsUrl(value)) {
    throw new Error(`Rejected non-https link URL: ${value}`);
  }

  return value;
}
