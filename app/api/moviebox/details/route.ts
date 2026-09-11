import { NextRequest, NextResponse } from "next/server";
import { fetchMovieBoxDetails } from "@/lib/movieBox";

export async function GET(req: NextRequest) {
  const detailPath = req.nextUrl.searchParams.get("detailPath");
  if (!detailPath) {
    return NextResponse.json({ error: "detailPath is required" }, { status: 400 });
  }
  try {
    const data = await fetchMovieBoxDetails(detailPath);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
}
