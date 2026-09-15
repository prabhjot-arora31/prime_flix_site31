"use client";

import { useEffect, useState } from "react";
import { useLinkStatus } from "next/link";

/** Drop inside a <Link>'s children (in a `relative`-positioned ancestor) to
 * show a dimming spinner while that link's navigation is pending. On a slow
 * or flaky connection, clicking a poster/avatar can otherwise look totally
 * unresponsive for several seconds — the destination page can't render
 * anything (not even its own loading skeleton) until Next has fetched the
 * route itself, and there's no built-in indicator for that wait. Skipped
 * automatically once the route's already been prefetched, so it only
 * appears when navigation is actually slow (see Next's useLinkStatus docs).
 *
 * The 150ms delay avoids a flash on normal fast navigations. */
export default function LinkPendingOverlay({ rounded = "rounded-lg" }: { rounded?: string }) {
  const { pending } = useLinkStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!pending) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(timer);
  }, [pending]);

  if (!show) return null;
  return (
    <div
      aria-hidden
      className={`absolute inset-0 z-10 flex items-center justify-center bg-black/60 ${rounded}`}
    >
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
    </div>
  );
}
