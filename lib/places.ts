import { prisma } from "@/lib/prisma";

type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  priceLevel?: number;
};

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24;

const mapPlaces = (results: any[]): PlaceResult[] =>
  results.map((place) => ({
    placeId: place.place_id,
    name: place.name,
    address: place.formatted_address ?? place.vicinity ?? "",
    lat: place.geometry?.location?.lat ?? 0,
    lng: place.geometry?.location?.lng ?? 0,
    priceLevel: place.price_level,
  }));

export async function getPlacesForQuery(
  query: string,
  ttlMs = DEFAULT_TTL_MS
): Promise<PlaceResult[]> {
  const cached = await prisma.placeCache.findUnique({
    where: { query },
  });

  if (cached) {
    const age = Date.now() - cached.updatedAt.getTime();
    if (age < ttlMs) {
      const data = cached.response as { places?: PlaceResult[] };
      return data.places ?? [];
    }
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return cached ? ((cached.response as { places?: PlaceResult[] }).places ?? []) : [];
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { results?: any[] };
  const places = mapPlaces(payload.results ?? []).slice(0, 6);

  await prisma.placeCache.upsert({
    where: { query },
    create: { query, response: { places } },
    update: { response: { places } },
  });

  return places;
}
