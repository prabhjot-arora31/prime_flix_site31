import { NextRequest, NextResponse } from "next/server";
import { searchMovieBox } from "@/lib/movieBox";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
  if (!q) return NextResponse.json({ items: [], hasMore: false });

  try {
    const data = await searchMovieBox(q, page);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
}
