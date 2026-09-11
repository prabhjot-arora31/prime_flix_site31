import { NextRequest, NextResponse } from "next/server";
import { fetchMovieBoxStream } from "@/lib/movieBox";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const subjectId = params.get("subjectId");
  const detailPath = params.get("detailPath");
  const type = parseInt(params.get("type") ?? "1", 10);
  const season = params.get("season") ? parseInt(params.get("season")!, 10) : undefined;
  const episode = params.get("episode") ? parseInt(params.get("episode")!, 10) : undefined;

  if (!subjectId || !detailPath) {
    return NextResponse.json(
      { error: "subjectId and detailPath are required" },
      { status: 400 },
    );
  }
  try {
    const data = await fetchMovieBoxStream({ subjectId, detailPath, type, season, episode });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
}
