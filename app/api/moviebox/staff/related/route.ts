import { NextRequest, NextResponse } from "next/server";
import { fetchRelatedStaff } from "@/lib/movieBox";

export async function GET(req: NextRequest) {
  const staffId = req.nextUrl.searchParams.get("staffId");
  if (!staffId) {
    return NextResponse.json({ error: "staffId is required" }, { status: 400 });
  }
  try {
    const items = await fetchRelatedStaff(staffId);
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
}
