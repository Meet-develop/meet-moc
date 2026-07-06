import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlacesForQuery } from "@/lib/places";

const DEFAULT_COUNT = 3;
const SUGGESTION_COUNT = 5;
const TOTAL_COUNT = DEFAULT_COUNT + SUGGESTION_COUNT;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get("purpose")?.trim() || "飲み";
    const eventArea = searchParams.get("eventArea")?.trim() || "";

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
      select: { favoriteAreas: true },
    });

    const favoriteAreas: string[] = (profile?.favoriteAreas as string[]) ?? [];
    const searchAreas = eventArea
      ? [eventArea, ...favoriteAreas.filter((a) => a !== eventArea)]
      : favoriteAreas;

    const uniqueByPlaceId = new Map<string, object>();

    for (const area of searchAreas.slice(0, 3)) {
      const places = await getPlacesForQuery(`${area} ${purpose}`.trim());
      for (const place of places) {
        if (!uniqueByPlaceId.has(place.placeId)) {
          uniqueByPlaceId.set(place.placeId, place);
        }
        if (uniqueByPlaceId.size >= TOTAL_COUNT) break;
      }
      if (uniqueByPlaceId.size >= TOTAL_COUNT) break;
    }

    if (uniqueByPlaceId.size < TOTAL_COUNT) {
      const fallbackQuery = searchAreas[0]
        ? `${searchAreas[0]} ${purpose}`
        : purpose;
      const places = await getPlacesForQuery(fallbackQuery);
      for (const place of places) {
        if (!uniqueByPlaceId.has(place.placeId)) {
          uniqueByPlaceId.set(place.placeId, place);
        }
        if (uniqueByPlaceId.size >= TOTAL_COUNT) break;
      }
    }

    const all = Array.from(uniqueByPlaceId.values());
    return NextResponse.json({
      defaults: all.slice(0, DEFAULT_COUNT),
      suggestions: all.slice(DEFAULT_COUNT, TOTAL_COUNT),
    });
  } catch (error) {
    console.error("[place-suggestions] unexpected error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
