"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ContinueWatchingEntry, listContinueWatching } from "@/lib/clientStorage";
import ScrollRow from "./ScrollRow";
import { PlayIcon } from "./icons";
import LinkPendingOverlay from "./LinkPendingOverlay";

export default function ContinueWatchingRow() {
  const [entries, setEntries] = useState<ContinueWatchingEntry[]>([]);

  useEffect(() => {
    setEntries(listContinueWatching());
  }, []);

  if (entries.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 px-4 text-lg font-semibold sm:px-6">Continue Watching</h2>
      <ScrollRow contentClassName="gap-3 px-4 pb-2 sm:px-6">
        {entries.map((entry) => {
          const fraction = entry.duration > 0 ? entry.position / entry.duration : 0;
          return (
            <Link
              key={entry.familyId}
              href={`/title/${entry.detailPath}?subjectId=${entry.subjectId}&type=${entry.type}`}
              className="group relative w-40 shrink-0 sm:w-48"
            >
              <div className="relative aspect-video overflow-hidden rounded-lg bg-surface shadow-md transition-transform duration-200 ease-out group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-black/60">
                <img
                  src={entry.poster}
                  alt={entry.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <PlayIcon className="h-10 w-10 text-white" />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
                  <div className="h-full bg-accent" style={{ width: `${Math.min(fraction * 100, 100)}%` }} />
                </div>
                <LinkPendingOverlay />
              </div>
              <p className="mt-1.5 line-clamp-1 text-xs font-medium text-white/90">
                {entry.title}
                {entry.season && entry.episode ? ` · S${entry.season} E${entry.episode}` : ""}
              </p>
            </Link>
          );
        })}
      </ScrollRow>
    </section>
  );
}
