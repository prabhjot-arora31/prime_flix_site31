"use client";

import { useEffect } from "react";
import { getCached, setCached } from "./pageCache";

/** Remembers window.scrollY under `key` and restores it on mount — paired
 * with pageCache's data caching, this is what actually makes "go to a
 * detail page, hit back" land you exactly where you left off, since
 * Next.js's own back-navigation scroll restoration isn't reliable for a
 * client-fetched page like this one. */
export function useScrollRestoration(key: string) {
  useEffect(() => {
    const saved = getCached<number>(`scroll:${key}`);
    if (saved) {
      // Next's router does its own post-navigation scroll adjustment
      // (typically back to 0) that can land *after* a single rAF here and
      // clobber it straight back — reasserting a few times over the next
      // several frames/ms reliably wins that race without a fixed guess at
      // exactly when Next's own adjustment settles.
      const attempts = [0, 50, 150, 300];
      const timers = attempts.map((delay) =>
        setTimeout(() => {
          if (Math.abs(window.scrollY - saved) > 2) window.scrollTo(0, saved);
        }, delay),
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [key]);

  useEffect(() => {
    // Captured on click, in the capture phase, rather than on 'scroll' —
    // Next's own scroll-to-top for the navigation this click triggers fires
    // a native `scroll` event on *this* (about-to-unmount) page well before
    // it actually unmounts, so a scroll-event-based save (even debounced)
    // reliably lost the race and saved that reset 0 instead. A capture-
    // phase click listener runs synchronously, before Next's own click
    // handling starts the navigation at all, so it always captures the
    // real position — a harmless extra write on clicks that don't
    // navigate anywhere.
    function onClickCapture() {
      setCached(`scroll:${key}`, window.scrollY);
    }
    window.addEventListener("click", onClickCapture, { capture: true });
    return () => window.removeEventListener("click", onClickCapture, { capture: true });
  }, [key]);
}
