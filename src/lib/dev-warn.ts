const warned = new Set<string>();

/**
 * Warns once per key outside production. Content can reference blocks or
 * figures this build doesn't know yet; readers should see nothing, authors a
 * single console line instead of one per render.
 */
export function warnOnceInDev(key: string, message: string) {
  if (process.env.NODE_ENV === "production" || warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}
