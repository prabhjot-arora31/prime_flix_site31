import { NextRequest, NextResponse } from "next/server";
import { fetchStaffFilmography } from "@/lib/movieBox";

export async function GET(req: NextRequest) {
  const staffId = req.nextUrl.searchParams.get("staffId");
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
  if (!staffId) {
    return NextResponse.json({ error: "staffId is required" }, { status: 400 });
  }
  try {
    const data = await fetchStaffFilmography(staffId, page);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
}
