import { NextRequest, NextResponse } from "next/server";
import { fetchMovieBoxChannel } from "@/lib/movieBox";

export async function GET(req: NextRequest) {
  const channel = req.nextUrl.searchParams.get("channel");
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
  if (channel !== "series" && channel !== "anime") {
    return NextResponse.json({ error: "channel must be 'series' or 'anime'" }, { status: 400 });
  }
  try {
    const data = await fetchMovieBoxChannel(channel, page);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
}
