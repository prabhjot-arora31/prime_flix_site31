import { NextRequest, NextResponse } from "next/server";
import { fetchMovieBoxRecs } from "@/lib/movieBox";

export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectId) {
    return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
  }
  try {
    const items = await fetchMovieBoxRecs(subjectId);
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
}
