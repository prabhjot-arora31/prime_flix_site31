// MovieBox (aoneroom/netfilm.world) endpoint templates — the values below
// are LOCAL FALLBACKS ONLY. Every templated URL is actually resolved live
// from Firebase Remote Config (lib/remoteConfig.ts, same `global_api_config`
// blob the Flutter app reads), since these domains rotate over time (already
// observed: MovieBox's real fast-download host is netfilm.world, not the
// aoneroom.com URL some app builds have baked in) — the fallback here is
// only what to use if that fetch fails outright.

import { getConfig } from "./remoteConfig";

export const globalUserAgent = () =>
  getConfig(
    "header_user_agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  );

export const movieBoxHomeApi = () =>
  getConfig("api_moviebox_home", "https://h5-api.aoneroom.com/wefeed-h5api-bff/home?host=moviebox.ph");

export const movieBoxTrendingApi = async (page: string) => {
  const tpl = await getConfig(
    "api_moviebox_trending",
    "https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/trending?page={page}&perPage=18",
  );
  return tpl.replace("{page}", page);
};

export const movieBoxDetailsApi = async (detailPath: string) => {
  const tpl = await getConfig(
    "api_moviebox_details",
    "https://h5-api.aoneroom.com/wefeed-h5api-bff/detail?detailPath={detailPath}",
  );
  return tpl.replace("{detailPath}", detailPath);
};

export const movieBoxRecsApi = async (id: string) => {
  const tpl = await getConfig(
    "api_moviebox_recs",
    "https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/detail-rec?subjectId={id}&page=1&perPage=12",
  );
  return tpl.replace("{id}", id);
};

export const movieBoxFilmographyApi = async (staffId: string, page: string) => {
  const tpl = await getConfig(
    "api_moviebox_filmography",
    "https://h5-api.aoneroom.com/wefeed-h5api-bff/staff/subject-list?perPage=24&page={page}&staffId={staffId}",
  );
  return tpl.replace("{page}", page).replace("{staffId}", staffId);
};

export const movieBoxRelatedStarsApi = async (staffId: string) => {
  const tpl = await getConfig(
    "api_moviebox_related_stars",
    "https://h5-api.aoneroom.com/wefeed-h5api-bff/staff/staff-related?staffId={staffId}",
  );
  return tpl.replace("{staffId}", staffId);
};

// Not remote-config-driven in the Flutter app either — MovieBoxSearchService
// hardcodes this one directly rather than reading it from ApiConfig.
export const movieBoxSearchApi = "https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/search";

// Also hardcoded directly in MovieBoxTV.dart / MovieBoxAnimation.dart rather
// than routed through ApiConfig — channelId 2 = Series, 1006 = Anime (the
// app's own tab labels; the class names "TV"/"Animation" are internal only).
export const movieBoxFilterApi = "https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/filter";

export const mbFastDownloadApi = async (
  subjectId: string,
  se: string,
  ep: string,
  detailPath: string,
) => {
  const tpl = await getConfig(
    "api_mb_fast_download",
    "https://netfilm.world/wefeed-h5api-bff/subject/play?subjectId={subjectId}&se={se}&ep={ep}&detailPath={detailPath}",
  );
  return tpl
    .replace("{subjectId}", subjectId)
    .replace("{se}", se)
    .replace("{ep}", ep)
    .replace("{detailPath}", detailPath);
};

export const mbFastDownloadReferer = () =>
  getConfig("api_mb_fast_dl_referer", "https://videodownloader.site/");

export const mbCaptionsApi = async (
  id: string,
  subjectId: string,
  detailPath: string,
  season?: string,
  episode?: string,
) => {
  const isTv = !!(season && episode);
  const tpl = await getConfig(
    isTv ? "api_mb_captions_tv" : "api_mb_captions_movie",
    isTv
      ? "https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/caption?format=MP4&id={id}&subjectId={subjectId}&detailPath={detailPath}"
      : "https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/caption?format=MP4&id={id}&subjectId={subjectId}",
  );
  let url = tpl
    .replace("{id}", id)
    .replace("{subjectId}", subjectId)
    .replace("{detailPath}", detailPath);
  if (isTv) url += `&season=${season}&episode=${episode}`;
  return url;
};

// Routes a hotlink-protected CDN url through our own /api/proxy so its
// Referer can be set server-side (see app/api/proxy/route.ts) — the browser
// can only ever suppress its own Referer, never spoof a different one.
export const proxiedUrl = (target: string, referer?: string) => {
  const params = new URLSearchParams({ url: target });
  if (referer) params.set("referer", referer);
  return `/api/proxy?${params.toString()}`;
};

// Converts a MovieBox .srt caption to WebVTT server-side (see
// app/api/subtitle/route.ts) — <track> can't parse raw SRT.
export const subtitleUrl = (target: string) => `/api/subtitle?url=${encodeURIComponent(target)}`;
