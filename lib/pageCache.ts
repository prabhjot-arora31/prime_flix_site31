// A plain in-memory cache (survives for the life of the tab/session, not
// persisted to disk) so that navigating home/tab/search -> detail -> back
// restores the previous screen's already-loaded data instantly instead of
// refetching from scratch. Next.js's App Router already restores scroll
// position on back/forward navigation on its own — it just needs the page
// to render its final content synchronously on mount (no loading flash) for
// that restoration to land in the right place, which is what reading from
// this cache via a lazy useState initializer gives us.
const cache = new Map<string, unknown>();

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCached<T>(key: string, value: T) {
  cache.set(key, value);
}
