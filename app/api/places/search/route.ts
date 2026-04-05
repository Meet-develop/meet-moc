import { NextResponse } from "next/server";
import { getAreaCandidatesForQuery, getPlacesForQuery } from "@/lib/places";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const limitParam = searchParams.get("limit");
  const kind = searchParams.get("kind") ?? "place";
  const limit = limitParam ? Number(limitParam) : 3;

  if (!query) {
    return NextResponse.json({ message: "Missing query" }, { status: 400 });
  }

  const places =
    kind === "area"
      ? await getAreaCandidatesForQuery(query)
      : await getPlacesForQuery(query);

  return NextResponse.json({
    query,
    kind,
    places: places.slice(0, Number.isFinite(limit) ? limit : 3),
  });
}
