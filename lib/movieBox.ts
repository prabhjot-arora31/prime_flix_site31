// MovieBox (aoneroom/netfilm.world) — ported from
// lib/services/movie_box_api_service.dart and lib/pages/MovieBox.dart /
// MovieBoxDetail.dart. Only the "fast-track" path is implemented:
// home/trending/details/download/captions all work with zero auth headers.
// The Flutter app's cookie-gated fallback (needs cookies harvested via a
// headless WebView) is deliberately left out — there's no browser here to
// harvest them from, and the fast-track path already covers the common case.
//
// Endpoint URLs are resolved live from Firebase Remote Config (see
// lib/apiConfig.ts / lib/remoteConfig.ts) rather than hardcoded, since these
// domains rotate over time.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  globalUserAgent,
  mbCaptionsApi,
  mbFastDownloadApi,
  mbFastDownloadReferer,
  movieBoxDetailsApi,
  movieBoxFilmographyApi,
  movieBoxFilterApi,
  movieBoxHomeApi,
  movieBoxRecsApi,
  movieBoxRelatedStarsApi,
  movieBoxSearchApi,
  movieBoxTrendingApi,
  proxiedUrl,
  subtitleUrl,
} from "./apiConfig";

export type ContentChannel = "series" | "anime";
const CHANNEL_IDS: Record<ContentChannel, number> = { series: 2, anime: 1006 };

// Search needs a Bearer token — the Flutter app gets one by harvesting a
// `token` cookie set by aoneroom.com in a WebView (or falls back to a
// hardcoded 90-day master token when that hasn't run yet). Neither is
// available here, but it turns out unnecessary: any aoneroom API response
// (confirmed on /home) sets a *fresh* guest `token` cookie itself, with no
// auth required to get it — so this just fetches home once and reuses that
// token, cached to disk (mirrors the "90 day" validity of the master token)
// until nearly its own expiry.
// os.tmpdir() rather than process.cwd() — the project directory is
// read-only on Vercel's deployment bundle (only /tmp is writable there),
// and this cache is disposable/ephemeral either way (lost on every cold
// start), so there's no benefit to the project-directory path that /tmp
// doesn't also give locally.
const TOKEN_STORE_PATH = path.join(os.tmpdir(), "prime-flix-moviebox-token.json");
const TOKEN_LIFETIME_MS = 80 * 24 * 60 * 60 * 1000; // 80 of the token's ~90 days

async function getGuestToken(): Promise<string> {
  try {
    const raw = fs.readFileSync(TOKEN_STORE_PATH, "utf-8");
    const cached = JSON.parse(raw);
    if (cached.token && Date.now() - cached.timestampMs < TOKEN_LIFETIME_MS) {
      return cached.token;
    }
  } catch {
    // no cache yet — fetch fresh below
  }

  const res = await fetch(await movieBoxHomeApi());
  const setCookie = res.headers.get("set-cookie");
  const match = setCookie ? /token=([^;]+)/.exec(setCookie) : null;
  if (!match) throw new Error("Could not obtain a MovieBox guest token");

  try {
    fs.writeFileSync(TOKEN_STORE_PATH, JSON.stringify({ token: match[1], timestampMs: Date.now() }));
  } catch {
    // Read-only filesystem (e.g. Vercel's deployment bundle outside /tmp) —
    // the disk cache is just an optimization to skip re-fetching the token
    // on every request; the token we just got is still perfectly usable.
  }
  return match[1];
}

export async function searchMovieBox(keyword: string, page: number) {
  const token = await getGuestToken();
  const res = await fetch(movieBoxSearchApi, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "user-agent": await globalUserAgent(),
    },
    body: JSON.stringify({ keyword, page: String(page), perPage: 28, subjectType: 0 }),
  });
  if (!res.ok) throw new Error(`Search HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message ?? "Search failed");

  const items = (json.data?.items ?? []).map((item: any) => ({
    title: item.title ?? "",
    rating: item.imdbRatingValue ?? "",
    poster: item.cover?.url ?? "",
    detailPath: item.detailPath ?? "",
    subjectId: item.subjectId ?? "",
    type: item.subjectType ?? 1,
  }));
  return { items, hasMore: json.data?.pager?.hasMore === true };
}

export type MovieBoxItem = {
  subjectId: string;
  detailPath: string;
  title: string;
  poster: string;
  backdrop: string;
  rating: string;
  genre: string;
  desc: string;
  type: number;
};

function normalizeSubject(item: any): MovieBoxItem {
  // Banner items nest the real subject fields one level down (item.subject),
  // and use item.image for a widescreen backdrop that non-banner category
  // items don't have at all — everything else lines up at the top level.
  const s = item.subject ?? item;
  return {
    subjectId: String(item.subjectId ?? s.subjectId ?? ""),
    detailPath: item.detailPath ?? s.detailPath ?? "",
    title: s.title ?? item.title ?? "",
    poster: s.cover?.url ?? "",
    backdrop: item.image?.url ?? s.stills?.url ?? s.cover?.url ?? "",
    rating: s.imdbRatingValue ?? "",
    genre: s.genre ?? "",
    desc: s.description ?? "",
    type: item.subjectType ?? s.subjectType ?? 1,
  };
}

export async function fetchMovieBoxHome() {
  const res = await fetch(await movieBoxHomeApi());
  if (!res.ok) throw new Error("Failed to load MovieBox home");
  const data = await res.json();

  let banners: MovieBoxItem[] = [];
  const categories: { title: string; items: MovieBoxItem[] }[] = [];

  for (const op of data.data.operatingList ?? []) {
    if (op.type === "BANNER" && op.banner) {
      banners = (op.banner.items ?? []).map(normalizeSubject);
    } else if (!String(op.title ?? "").includes("Hot Short TV")) {
      categories.push({
        title: op.title ?? "Untitled",
        items: (op.subjects ?? []).map(normalizeSubject),
      });
    }
  }

  return { banners, categories };
}

export async function fetchMovieBoxTrending(page: number) {
  const res = await fetch(await movieBoxTrendingApi(String(page)));
  if (!res.ok) throw new Error("Failed to load MovieBox trending");
  const data = await res.json();
  return {
    items: data.data.subjectList ?? [],
    title: data.data.title ?? "Trending",
    hasMore: data.data.pager?.hasMore === true,
    nextPage: Number(data.data.pager?.nextPage) || page + 1,
  };
}

export async function fetchMovieBoxChannel(channel: ContentChannel, page: number) {
  const res = await fetch(movieBoxFilterApi, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": await globalUserAgent() },
    body: JSON.stringify({ page, perPage: 28, channelId: CHANNEL_IDS[channel] }),
  });
  if (!res.ok) throw new Error(`Failed to load ${channel} feed`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message ?? "Failed to load feed");
  return {
    items: (json.data?.items ?? []).map(normalizeSubject),
    hasMore: json.data?.pager?.hasMore === true,
    nextPage: Number(json.data?.pager?.nextPage) || page + 1,
  };
}

export async function fetchMovieBoxDetails(detailPath: string) {
  const res = await fetch(await movieBoxDetailsApi(detailPath), {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message ?? "API error");

  const subject = json.data.subject;
  const resource = json.data.resource;
  const subjectType = subject.subjectType ?? 1;
  const isSeries = subjectType === 2 || subjectType === 7;

  return {
    title: subject.title ?? "",
    desc: subject.description ?? "",
    poster: subject.cover?.url ?? "",
    backdrop: subject.stills?.url ?? "",
    releaseYear: (subject.releaseDate ?? "").split("-")[0] ?? "",
    rating: subject.imdbRatingValue ?? "",
    country: subject.countryName ?? "",
    genre: subject.genre ?? "",
    type: subjectType,
    isSeries,
    seasons: isSeries ? (resource?.seasons ?? []) : [],
    stars: json.data.stars ?? [],
    // Each "dub" (or subtitled-only variant) of a title is a wholly separate
    // MovieBox subject — its own subjectId/detailPath, not an alternate
    // audio track inside one stream. Picking one means navigating to that
    // variant's own detail page, not switching a track in the player.
    dubs: (subject.dubs ?? []).map((d: any) => ({
      subjectId: String(d.subjectId ?? ""),
      detailPath: d.detailPath ?? "",
      label: d.lanName ?? d.lanCode ?? "",
      lanCode: d.lanCode ?? "",
      isOriginal: d.original === true,
      isSubOnly: d.type === 1,
    })),
  };
}

export async function fetchMovieBoxRecs(subjectId: string) {
  const res = await fetch(await movieBoxRecsApi(subjectId));
  if (!res.ok) throw new Error("Failed to load recommendations");
  const json = await res.json();
  return json.data?.items ?? [];
}

export async function fetchStaffFilmography(staffId: string, page: number) {
  const res = await fetch(await movieBoxFilmographyApi(staffId, String(page)));
  if (!res.ok) throw new Error("Failed to load filmography");
  const json = await res.json();
  return {
    items: (json.data?.items ?? []).map(normalizeSubject),
    hasMore: json.data?.pager?.hasMore === true,
    nextPage: Number(json.data?.pager?.nextPage) || page + 1,
  };
}

export async function fetchRelatedStaff(staffId: string) {
  const res = await fetch(await movieBoxRelatedStarsApi(staffId));
  if (!res.ok) throw new Error("Failed to load related staff");
  const json = await res.json();
  return (json.data?.items ?? []).map((s: any) => ({
    staffId: String(s.staffId ?? ""),
    detailPath: s.detailPath ?? "",
    name: s.name ?? "",
    avatarUrl: s.avatarUrl ?? "",
    description: s.description ?? "",
    born: s.born ?? "",
  }));
}

export function episodesForSeason(season: any): number[] {
  const allEpStr = String(season.allEp ?? "");
  const maxEp = season.maxEp ?? 0;
  if (allEpStr) {
    return allEpStr
      .split(",")
      .map((e: string) => parseInt(e.trim(), 10))
      .filter((e: number) => e > 0);
  }
  if (maxEp > 0) return Array.from({ length: maxEp }, (_, i) => i + 1);
  return [];
}

export async function fetchMovieBoxStream(opts: {
  subjectId: string;
  detailPath: string;
  type: number;
  season?: number;
  episode?: number;
}) {
  const isTvShow = opts.type === 2 || opts.type === 7;
  const se = isTvShow ? String(opts.season ?? 0) : "0";
  const ep = isTvShow ? String(opts.episode ?? 0) : "0";

  const [url, referer, userAgent] = await Promise.all([
    mbFastDownloadApi(opts.subjectId, se, ep, opts.detailPath),
    mbFastDownloadReferer(),
    globalUserAgent(),
  ]);

  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": userAgent, referer },
  });
  if (!res.ok) throw new Error(`Stream HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 0 || !json.data) throw new Error(json.message ?? "Stream unavailable");

  // The Flutter app's ApiService reads `data.streams`/`resolutions`, but the
  // live API actually responds with `data.downloads`/`resolution` (singular)
  // — checking both keeps this working whichever shape a given response uses.
  const streams: any[] = json.data.downloads ?? json.data.streams ?? [];
  if (streams.length === 0) throw new Error("No streams available");

  const resolutionOf = (s: any) => parseInt(s.resolution ?? s.resolutions) || 0;
  streams.sort((a, b) => resolutionOf(b) - resolutionOf(a));

  const allStreams = streams.map((s) => ({
    url: s.url ? proxiedUrl(String(s.url), referer) : "",
    label: `${resolutionOf(s) || "Auto"}p`,
    id: String(s.id ?? ""),
  }));
  const playable = allStreams.filter((s) => s.url);
  if (playable.length === 0) throw new Error("This title requires a VIP unlock");
  // playable is sorted highest-resolution-first, so with no quality cap the
  // best pick is simply the first playable entry.

  // Subtitles (best-effort, same secondary call the Flutter app makes)
  let subtitles: any[] = [];
  try {
    const captionUrl = await mbCaptionsApi(
      allStreams[0].id,
      opts.subjectId,
      opts.detailPath,
      isTvShow ? se : undefined,
      isTvShow ? ep : undefined,
    );
    const capRes = await fetch(captionUrl, {
      headers: { accept: "application/json", "user-agent": userAgent, referer },
    });
    if (capRes.ok) {
      const capJson = await capRes.json();
      subtitles = (capJson.data?.captions ?? []).map((c: any) => {
        const raw = String(c.url ?? "").startsWith("//") ? `https:${c.url}` : c.url;
        return {
          file: subtitleUrl(raw),
          label: c.lanName ?? "Subtitle",
          language: c.lan ?? "en",
        };
      });
    }
  } catch {
    // best-effort only
  }

  return { bestUrl: playable[0].url, allStreams: playable, subtitles };
}
