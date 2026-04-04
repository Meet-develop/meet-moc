import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    ownerId?: string;
    timeCandidateId?: string;
    placeCandidateId?: string;
  };

  if (!body.ownerId) {
    return NextResponse.json({ message: "Missing ownerId" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== body.ownerId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const timeCandidate = body.timeCandidateId
    ? await prisma.eventTimeCandidate.findUnique({
        where: { id: body.timeCandidateId },
      })
    : null;
  const placeCandidate = body.placeCandidateId
    ? await prisma.eventPlaceCandidate.findUnique({
        where: { id: body.placeCandidateId },
      })
    : null;

  const updated = await prisma.event.update({
    where: { id },
    data: {
      status: "confirmed",
      fixedStartTime: timeCandidate?.startTime ?? event.fixedStartTime,
      fixedEndTime: timeCandidate?.endTime ?? event.fixedEndTime,
      fixedPlaceId: placeCandidate?.placeId ?? event.fixedPlaceId,
      fixedPlaceName: placeCandidate?.name ?? event.fixedPlaceName,
      fixedPlaceAddress: placeCandidate?.address ?? event.fixedPlaceAddress,
    },
  });

  return NextResponse.json({ status: updated.status });
}
