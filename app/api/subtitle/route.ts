import { NextRequest } from "next/server";

const ALLOWED_HOSTS = ["hakunaymatata.com"];

function isAllowedHost(hostname: string) {
  return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

// MovieBox's caption files are plain .srt, but the browser's native <track>
// element only parses WebVTT — feeding it a raw .srt URL just fails silently
// (no error, subtitles simply never appear). This fetches the .srt server-side
// and converts it: prepend the WEBVTT header, and swap SRT's comma decimal
// separator in timestamps (00:00:01,000) for VTT's period (00:00:01.000).
export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) return new Response("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }
  if (!isAllowedHost(parsed.hostname)) return new Response("Host not allowed", { status: 403 });

  const res = await fetch(target);
  if (!res.ok) return new Response("Failed to fetch subtitle", { status: 502 });

  const srt = await res.text();
  const vtt = "WEBVTT\n\n" + srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");

  return new Response(vtt, {
    headers: { "content-type": "text/vtt; charset=utf-8" },
  });
}
