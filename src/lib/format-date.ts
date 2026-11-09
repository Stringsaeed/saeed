// Shared by server and client components; lib/content.ts is server-only.
export function formatPostDate(
  date: string,
  format: "compact" | "full" = "compact",
) {
  return new Intl.DateTimeFormat("en-US", {
    month: format === "full" ? "long" : "short",
    day: format === "full" ? "numeric" : undefined,
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}
