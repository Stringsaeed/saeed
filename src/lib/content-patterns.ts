export const postDatePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export const blogImagePathPattern =
  /^\/images\/blog\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function isBlogImagePath(src: string): boolean {
  if (!blogImagePathPattern.test(src)) {
    return false;
  }

  try {
    return !decodeURIComponent(src).includes("..");
  } catch {
    return false;
  }
}
