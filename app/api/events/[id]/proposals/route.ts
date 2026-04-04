import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    userId?: string;
    type?: "time" | "place";
    startTime?: string;
    place?: {
      placeId: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
      priceLevel?: number;
    };
  };

  if (!body.userId || !body.type) {
    return NextResponse.json(
      { message: "userId and type are required" },
      { status: 400 }
    );
  }

  if (body.type === "time") {
    if (!body.startTime) {
      return NextResponse.json(
        { message: "startTime is required" },
        { status: 400 }
      );
    }

    const start = new Date(body.startTime);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const candidate = await prisma.eventTimeCandidate.create({
      data: {
        eventId: id,
        startTime: start,
        endTime: end,
        score: 0,
        source: "proposal",
        proposedBy: body.userId,
      },
    });

    return NextResponse.json({ id: candidate.id });
  }

  if (!body.place) {
    return NextResponse.json(
      { message: "place is required" },
      { status: 400 }
    );
  }

  const candidate = await prisma.eventPlaceCandidate.create({
    data: {
      eventId: id,
      placeId: body.place.placeId,
      name: body.place.name,
      address: body.place.address,
      lat: body.place.lat,
      lng: body.place.lng,
      priceLevel: body.place.priceLevel,
      score: 0,
      source: "proposal",
      proposedBy: body.userId,
    },
  });

  return NextResponse.json({ id: candidate.id });
}
