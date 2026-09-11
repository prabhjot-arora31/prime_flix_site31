"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import HeroBanner from "@/components/HeroBanner";
import MovieRow from "@/components/MovieRow";
import MovieCard from "@/components/MovieCard";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import TabBar from "@/components/TabBar";
import RowSkeleton from "@/components/RowSkeleton";
import PosterGridSkeleton from "@/components/PosterGridSkeleton";
import { getCached, setCached } from "@/lib/pageCache";
import { useScrollRestoration } from "@/lib/useScrollRestoration";
import { useInfiniteScroll } from "@/lib/useInfiniteScroll";
import type { ContentChannel, MovieBoxItem } from "@/lib/movieBox";

type HomeData = { banners: MovieBoxItem[]; categories: { title: string; items: MovieBoxItem[] }[] };
type ChannelCache = { items: MovieBoxItem[]; page: number; hasMore: boolean };

function ChannelFeed({ channel }: { channel: ContentChannel }) {
  const cacheKey = `channel:${channel}`;
  const [items, setItems] = useState<MovieBoxItem[] | null>(
    () => getCached<ChannelCache>(cacheKey)?.items ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(() => getCached<ChannelCache>(cacheKey)?.page ?? 1);
  const [hasMore, setHasMore] = useState(() => getCached<ChannelCache>(cacheKey)?.hasMore ?? false);
  const [loadingMore, setLoadingMore] = useState(false);

  useScrollRestoration(`tab:${channel}`);

  // Re-checked (not just read once) so switching tabs — which changes
  // `channel` on this same mounted component rather than remounting it —
  // also picks up that tab's own cache instead of showing stale items.
  useEffect(() => {
    const cached = getCached<ChannelCache>(cacheKey);
    if (cached) {
      setItems(cached.items);
      setPage(cached.page);
      setHasMore(cached.hasMore);
      setError(null);
      return;
    }
    setItems(null);
    setError(null);
    fetch(`/api/moviebox/channel?channel=${channel}&page=1`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setItems(d.items);
        setHasMore(d.hasMore);
        setPage(d.nextPage);
        setCached(cacheKey, { items: d.items, page: d.nextPage, hasMore: d.hasMore });
      })
      .catch((e) => setError(e.message ?? String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/moviebox/channel?channel=${channel}&page=${page}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      const newItems = [...(items ?? []), ...d.items];
      setItems(newItems);
      setHasMore(d.hasMore);
      setPage(d.nextPage);
      setCached(cacheKey, { items: newItems, page: d.nextPage, hasMore: d.hasMore });
    } catch {
      // best-effort
    } finally {
      setLoadingMore(false);
    }
  }

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  return (
    <div className="px-4 py-6 sm:px-6">
      {error && <p className="text-red-400">{error}</p>}
      {!items && !error && <PosterGridSkeleton count={24} />}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {items?.map((item, i) => (
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
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const tab = (searchParams.get("tab") as ContentChannel | null) ?? "movies";

  const [home, setHome] = useState<HomeData | null>(() => getCached<HomeData>("home") ?? null);
  const [homeError, setHomeError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<MovieBoxItem[] | null>(
    () => (q ? getCached<MovieBoxItem[]>(`search:${q}`) : null) ?? null,
  );
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useScrollRestoration(q ? `search:${q}` : "tab:movies");

  // Home loads once, independent of `q`/`tab`, so flipping back is instant
  // even without the cache — the cache on top of that means a fresh mount
  // (e.g. returning from a detail page) skips the fetch entirely.
  useEffect(() => {
    if (home || homeError) return;
    fetch("/api/moviebox/home")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setHome(d);
        setCached("home", d);
      })
      .catch((e) => setHomeError(e.message ?? String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!q) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }
    const cached = getCached<MovieBoxItem[]>(`search:${q}`);
    if (cached) {
      setSearchResults(cached);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    fetch(`/api/moviebox/search?q=${encodeURIComponent(q)}&page=1`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setSearchResults(d.items);
        setCached(`search:${q}`, d.items);
      })
      .catch((e) => setSearchError(e.message ?? String(e)))
      .finally(() => setSearchLoading(false));
  }, [q]);

  if (q) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <h1 className="mb-4 text-xl font-semibold">Results for &ldquo;{q}&rdquo;</h1>
        {searchLoading && <PosterGridSkeleton count={24} />}
        {searchError && <p className="text-red-400">{searchError}</p>}
        {searchResults && searchResults.length === 0 && !searchLoading && (
          <p className="text-muted">No results found.</p>
        )}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {searchResults?.map((item, i) => (
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
      </div>
    );
  }

  if (tab === "series" || tab === "anime") {
    return <ChannelFeed channel={tab} />;
  }

  if (homeError) return <div className="p-6 text-red-400">{homeError}</div>;
  if (!home) {
    return (
      <div className="pb-10">
        <div className="h-[52vw] max-h-110 min-h-60 w-full animate-pulse bg-surface" />
        <div className="pt-6">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <HeroBanner items={home.banners.slice(0, 6)} />
      <div className="pt-6">
        <ContinueWatchingRow />
        {home.categories.map((cat, i) => (
          <MovieRow key={`${cat.title}-${i}`} title={cat.title} items={cat.items} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <TabBar />
      <HomeContent />
    </Suspense>
  );
}
