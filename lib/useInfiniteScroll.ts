"use client";

import { useEffect, useRef } from "react";

/** Attach the returned ref to a sentinel element at the end of a list —
 * `onLoadMore` fires once it scrolls near-into view, replacing an explicit
 * "Load more" button. Guards against re-firing while a load is already
 * in flight or there's nothing left to load. */
export function useInfiniteScroll(onLoadMore: () => void, hasMore: boolean, loading: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onLoadMore);
  callbackRef.current = onLoadMore;

  useEffect(() => {
    const el = ref.current;
    // Also gated on `loading`: recreating the observer while a fetch is
    // already in flight would otherwise immediately re-fire for a sentinel
    // that's still on screen, double-triggering the next page.
    if (!el || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) callbackRef.current();
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return ref;
}
