"use client";

import MovieCard from "./MovieCard";
import ScrollRow from "./ScrollRow";
import type { MovieBoxItem } from "@/lib/movieBox";

export default function MovieRow({ title, items }: { title: string; items: MovieBoxItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 px-4 text-lg font-semibold sm:px-6">{title}</h2>
      <ScrollRow contentClassName="gap-3 px-4 pb-2 sm:px-6">
        {items.map((item, i) => (
          <MovieCard
            key={`${item.subjectId}-${i}`}
            title={item.title}
            poster={item.poster}
            rating={item.rating}
            href={`/title/${item.detailPath}?subjectId=${item.subjectId}&type=${item.type}`}
          />
        ))}
      </ScrollRow>
    </section>
  );
}
