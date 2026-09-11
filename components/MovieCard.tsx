"use client";

import { useState } from "react";
import Link from "next/link";
import { FilmIcon } from "./icons";

export default function MovieCard({
  title,
  poster,
  rating,
  href,
  fluid = false,
}: {
  title: string;
  poster: string;
  rating?: string;
  href: string;
  /** true for grid layouts (search results) — fills its grid cell instead of
   * the fixed width used for horizontal scrolling rows. */
  fluid?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !poster || failed;

  return (
    <Link
      href={href}
      className={
        fluid ? "group relative block w-full" : "group relative block w-30 shrink-0 sm:w-36 md:w-40"
      }
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-surface shadow-md transition-transform duration-200 ease-out group-hover:z-10 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-black/60">
        {showFallback ? (
          <div className="flex h-full w-full items-center justify-center">
            <FilmIcon className="h-8 w-8 text-white/20" />
          </div>
        ) : (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        )}
        {rating && (
          <span className="absolute top-1.5 right-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 backdrop-blur-sm">
            ★ {rating}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <p className="line-clamp-2 text-xs font-medium text-white">{title}</p>
        </div>
      </div>
    </Link>
  );
}
