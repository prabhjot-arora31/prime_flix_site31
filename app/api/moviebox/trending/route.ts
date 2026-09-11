import { NextRequest, NextResponse } from "next/server";
import { fetchMovieBoxTrending } from "@/lib/movieBox";

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
  try {
    const data = await fetchMovieBoxTrending(page);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
}
