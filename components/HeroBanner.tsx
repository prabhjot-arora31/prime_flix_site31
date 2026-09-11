"use client";

import Link from "next/link";
import ScrollRow from "./ScrollRow";
import { PlayIcon } from "./icons";
import type { MovieBoxItem } from "@/lib/movieBox";

export default function HeroBanner({ items }: { items: MovieBoxItem[] }) {
  if (items.length === 0) return null;

  return (
    <ScrollRow contentClassName="snap-x snap-mandatory">
      {items.map((item, i) => (
        <Link
          key={`${item.subjectId}-${i}`}
          href={`/title/${item.detailPath}?subjectId=${item.subjectId}&type=${item.type}`}
          className="relative h-[52vw] max-h-[440px] min-h-[240px] w-full shrink-0 snap-center"
        >
          {(item.backdrop || item.poster) && (
            <img
              src={item.backdrop || item.poster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0")}
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/10 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-background/70 via-transparent to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
            <h1 className="max-w-xl text-2xl font-bold text-white drop-shadow-lg sm:text-4xl">
              {item.title}
            </h1>
            <p className="mt-2 text-xs text-white/70 sm:text-sm">
              {[item.rating && `★ ${item.rating}`, item.genre].filter(Boolean).join("  ·  ")}
            </p>
            {item.desc && (
              <p className="mt-2 hidden max-w-lg text-sm text-white/60 sm:line-clamp-2 md:block">
                {item.desc}
              </p>
            )}
            <span className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-strong">
              <PlayIcon className="h-4 w-4" /> Play
            </span>
          </div>
        </Link>
      ))}
    </ScrollRow>
  );
}
