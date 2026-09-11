import { NextResponse } from "next/server";
import { fetchMovieBoxHome } from "@/lib/movieBox";

export async function GET() {
  try {
    const data = await fetchMovieBoxHome();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
}
