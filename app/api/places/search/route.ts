import { NextResponse } from "next/server";
import { getPlacesForQuery } from "@/lib/places";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 3;

  if (!query) {
    return NextResponse.json({ message: "Missing query" }, { status: 400 });
  }

  const places = await getPlacesForQuery(query);

  return NextResponse.json({
    query,
    places: places.slice(0, Number.isFinite(limit) ? limit : 3),
  });
}
