# PrimeFlix Web (standalone)

A plain Next.js app, independent of the Flutter project, that talks to the
same non-TMDB sources the app uses: Netflix/Prime Video/Disney+ clone sites
(net22.cc/net50.cc/net52.cc/net77.cc) and MovieBox (aoneroom.com). All calls
happen in Next.js Route Handlers (server-side), so CORS doesn't apply — the
browser only ever talks to `/api/*` on this app.

## Run it

```bash
cd webapp
npm install
npm run dev
```

Then open http://localhost:3000.

## What actually works right now (tested live from this sandbox)

| Source | Home | Details | Play |
|---|---|---|---|
| **MovieBox** | ✅ | ✅ | ✅ (fast-track, no cookies needed) |
| **Prime Video** | ✅ (public JSON) | ❌ needs session cookie | ❌ needs session cookie |
| **Disney+** | ✅ (bundled JSON, no live API) | ❌ needs session cookie | ❌ needs session cookie |
| **Netflix** | ❌ needs session cookie | ❌ needs session cookie | ❌ needs session cookie |

**MovieBox is fully working end-to-end** — home, details, and stream
resolution all succeeded live in testing, with zero auth.

**Netflix/Prime Video/Disney+ details & playback all share one blocker**:
they need a `t_hash_p` session cookie, normally obtained by POSTing spoofed
browser headers to `net50.cc/verify` (see `lib/cookieStore.ts`). That POST
returned no cookie when tested from this sandbox — Cloudflare is likely
fingerprinting the sandbox's datacenter egress IP more aggressively than a
residential one. **This is worth re-testing from your own machine** — run
`npm run dev` locally and hit `POST /api/verify`, since a home/office IP may
get a different outcome than this environment did. If it still fails, the
Flutter app's own fallback (an interactive WebView solving a Cloudflare
challenge) has no equivalent here — there's no browser to solve it in.

## Structure

- `lib/apiConfig.ts` — endpoint templates, ported from `lib/constants/api_config.dart`
- `lib/cookieStore.ts` — in-memory `t_hash_p`/`user_token` cache (process-lifetime, not persisted to disk)
- `lib/ott.ts` — Netflix/PV/Disney+ home/details/episodes/stream, ported from `OttDetails.dart`, `ott_playback_service.dart`, `fetch_netflix_movies.dart`
- `lib/movieBox.ts` — MovieBox home/trending/details/stream, ported from `MovieBoxApiService`/`MovieBox.dart`/`MovieBoxDetail.dart` (fast-track path only — the cookie-gated `netfilm.world` fallback needs cookies harvested via a headless WebView, which has no equivalent here and was left out)
- `data/disney_plus*.json` — copied from the Flutter app's bundled asset fallback (Disney+ has no live home API; the app itself falls back to Firebase Remote Config or these same files)
- `app/api/*` — one route per endpoint above
- `app/{netflix,pv,disney,moviebox}` — browse pages
- `components/OttDetail.tsx` — shared Netflix/PV/Disney+ detail+player page
- `components/VideoPlayer.tsx` — hls.js-backed `<video>` for `.m3u8` streams, plain `<video>` otherwise

## Known gaps vs. the Flutter app

- TMDB is intentionally excluded (per request).
- MovieBox's cookie-gated fallback path isn't implemented (fast-track already covers the common case).
- No "Continue Watching", downloads, or My List — this is a browse-and-play testbed, not a feature-complete clone.
- No episode "next season" pagination walk (`resolveNext` in the Flutter app) — episodes are fetched one season/page at a time.
