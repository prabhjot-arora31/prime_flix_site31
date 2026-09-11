"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

/** Wraps a horizontally-scrolling row with hover-revealed nav arrows that
 * only appear on the side there's actually more content to scroll to. */
export default function ScrollRow({
  children,
  contentClassName = "",
}: {
  children: ReactNode;
  contentClassName?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
      window.removeEventListener("resize", updateArrows);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  function scrollBy(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className="group/row relative">
      <div ref={scrollRef} className={`no-scrollbar flex overflow-x-auto ${contentClassName}`}>
        {children}
      </div>

      {canLeft && (
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          className="absolute inset-y-0 left-0 z-10 hidden w-14 items-center justify-start bg-linear-to-r from-background via-background/70 to-transparent pl-1 opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 sm:flex"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-lg text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-110 hover:bg-black/90">
            ‹
          </span>
        </button>
      )}
      {canRight && (
        <button
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="absolute inset-y-0 right-0 z-10 hidden w-14 items-center justify-end bg-linear-to-l from-background via-background/70 to-transparent pr-1 opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 sm:flex"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-lg text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-110 hover:bg-black/90">
            ›
          </span>
        </button>
      )}
    </div>
  );
}
