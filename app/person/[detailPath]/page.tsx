"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MovieCard from "@/components/MovieCard";
import PersonCard from "@/components/PersonCard";
import ScrollRow from "@/components/ScrollRow";
import BackButton from "@/components/BackButton";
import PosterGridSkeleton from "@/components/PosterGridSkeleton";
import Avatar from "@/components/Avatar";
import { getCached, setCached } from "@/lib/pageCache";
import { useScrollRestoration } from "@/lib/useScrollRestoration";
import { useInfiniteScroll } from "@/lib/useInfiniteScroll";
import type { MovieBoxItem } from "@/lib/movieBox";

type FilmsCache = { items: MovieBoxItem[]; page: number; hasMore: boolean };

export default function PersonPage() {
  const params = useParams<{ detailPath: string }>();
  const searchParams = useSearchParams();
  const staffId = searchParams.get("staffId") ?? "";
  const name = searchParams.get("name") ?? "";
  const avatarUrl = searchParams.get("avatarUrl") ?? "";
  const subtitle = searchParams.get("subtitle") ?? "";
  const description = searchParams.get("description") ?? "";
  const born = searchParams.get("born") ?? "";

  const filmsKey = `person-films:${staffId}`;
  const relatedKey = `person-related:${staffId}`;

  const [films, setFilms] = useState<MovieBoxItem[] | null>(() => getCached<FilmsCache>(filmsKey)?.items ?? null);
  const [filmsError, setFilmsError] = useState<string | null>(null);
  const [page, setPage] = useState(() => getCached<FilmsCache>(filmsKey)?.page ?? 1);
  const [hasMore, setHasMore] = useState(() => getCached<FilmsCache>(filmsKey)?.hasMore ?? false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [related, setRelated] = useState<any[] | null>(() => getCached<any[]>(relatedKey) ?? null);

  useScrollRestoration(`person:${staffId}`);

  useEffect(() => {
    if (!staffId) return;

    const cachedFilms = getCached<FilmsCache>(filmsKey);
    if (cachedFilms) {
      setFilms(cachedFilms.items);
      setPage(cachedFilms.page);
      setHasMore(cachedFilms.hasMore);
    } else {
      fetch(`/api/moviebox/staff?staffId=${staffId}&page=1`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) throw new Error(d.error);
          setFilms(d.items);
          setHasMore(d.hasMore);
          setPage(d.nextPage);
          setCached(filmsKey, { items: d.items, page: d.nextPage, hasMore: d.hasMore });
        })
        .catch((e) => setFilmsError(e.message ?? String(e)));
    }

    if (getCached<any[]>(relatedKey) === undefined) {
      fetch(`/api/moviebox/staff/related?staffId=${staffId}`)
        .then((r) => r.json())
        .then((d) => {
          setRelated(d.items ?? []);
          setCached(relatedKey, d.items ?? []);
        })
        .catch(() => setRelated([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/moviebox/staff?staffId=${staffId}&page=${page}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      const newItems = [...(films ?? []), ...d.items];
      setFilms(newItems);
      setHasMore(d.hasMore);
      setPage(d.nextPage);
      setCached(filmsKey, { items: newItems, page: d.nextPage, hasMore: d.hasMore });
    } catch {
      // best-effort
    } finally {
      setLoadingMore(false);
    }
  }

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <BackButton className="mb-6" />
      <div className="flex items-start gap-5">
        <Avatar src={avatarUrl} alt={name} className="h-28 w-28 shrink-0 shadow-xl sm:h-36 sm:w-36" />
        <div className="min-w-0 pt-2">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{name}</h1>
          {subtitle && <p className="mt-1 text-sm text-accent">{subtitle}</p>}
          {born && <p className="mt-1 text-xs text-muted">Born {born}</p>}
          {description && (
            <p className="mt-3 max-w-2xl text-sm text-white/70 line-clamp-6">{description}</p>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Filmography</h2>
        {filmsError && <p className="text-red-400">{filmsError}</p>}
        {!films && !filmsError && <PosterGridSkeleton />}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {films?.map((item, i) => (
            <MovieCard
              key={`${item.subjectId}-${i}`}
              fluid
              title={item.title}
              poster={item.poster}
              rating={item.rating}
              href={`/title/${item.detailPath}?subjectId=${item.subjectId}&type=${item.type}`}
            />
          ))}
        </div>
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-6">
            {loadingMore && (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            )}
          </div>
        )}
      </div>

      {related && related.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Related People</h2>
          <ScrollRow contentClassName="gap-4 pb-2">
            {related.map((p, i) => (
              <PersonCard
                key={`${p.staffId}-${i}`}
                staffId={p.staffId}
                detailPath={p.detailPath}
                name={p.name}
                avatarUrl={p.avatarUrl}
                description={p.description}
                born={p.born}
              />
            ))}
          </ScrollRow>
        </div>
      )}
    </div>
  );
}
