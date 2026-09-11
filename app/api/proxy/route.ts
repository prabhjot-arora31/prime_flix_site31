import { NextRequest } from "next/server";

// Edge runtime uses a different outbound IP pool than Vercel's Node.js
// serverless functions — worth trying since the video CDN (BunnyCDN) blocks
// the serverless pool's datacenter IPs outright (426) while allowing
// requests from residential IPs. Edge Runtime has no filesystem access, so
// this route can't go through lib/remoteConfig.ts's file-cached
// globalUserAgent() — a plain hardcoded fallback UA is used directly
// instead (same string as apiConfig.ts's own fallback).
export const runtime = "edge";

const FALLBACK_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

// Streams a remote video/subtitle file back through our own origin, with a
// server-controlled Referer — the CDN behind MovieBox's fast-download links
// (bcdnw.hakunaymatata.com) hotlink-protects by Referer (confirmed: the
// exact same signed URL returns 429 with no/wrong referer, 206 with
// referer=https://videodownloader.site/). A browser can only suppress its
// own Referer, never spoof it to a different origin, so there's no
// client-side fix — this proxy is the only way to make playback work from a
// page not served from videodownloader.site itself.
//
// Restricted to known source CDNs so this doesn't become an open proxy.
const ALLOWED_HOSTS = [
  "hakunaymatata.com",
  "aoneroom.com",
  "netfilm.world",
  "net22.cc",
  "net50.cc",
  "net51.cc",
  "net52.cc",
  "net77.cc",
];

function isAllowedHost(hostname: string) {
  return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  const referer = req.nextUrl.searchParams.get("referer") ?? undefined;
  if (!target) {
    return new Response("Missing url", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }
  if (!isAllowedHost(parsed.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  const range = req.headers.get("range");
  const upstream = await fetch(target, {
    headers: {
      accept: "*/*",
      "user-agent": FALLBACK_USER_AGENT,
      ...(referer ? { referer } : {}),
      ...(range ? { range } : {}),
    },
    redirect: "follow",
  });

  const headers = new Headers();
  for (const h of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "cache-control",
  ]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
