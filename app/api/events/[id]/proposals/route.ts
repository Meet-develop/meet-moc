import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseIsoDateTimeWithTimeZone } from "@/lib/datetime";

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

  const [event, participant] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      select: {
        status: true,
        placeCandidates: {
          include: { votes: true },
        },
      },
    }),
    prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: body.userId,
        },
      },
      select: { status: true },
    }),
  ]);

  if (!event) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (!participant || participant.status !== "approved") {
    return NextResponse.json(
      { message: "Only approved participants can add proposals" },
      { status: 403 }
    );
  }

  if (event.status !== "open") {
    return NextResponse.json(
      { message: "Only open events can receive proposals" },
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

    const start = parseIsoDateTimeWithTimeZone(body.startTime);
    if (!start) {
      return NextResponse.json(
        {
          message:
            "startTime must include timezone offset or Z (ISO 8601), e.g. 2026-04-10T10:00:00.000Z",
        },
        { status: 400 }
      );
    }
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

  type PlaceCandidateWithVotes = {
    id: string;
    placeId: string;
    source: string;
    score: number;
    createdAt: Date;
    votes: Array<{ score: number }>;
  };

  const placeCandidates = event.placeCandidates as PlaceCandidateWithVotes[];

  const normalizedPlaceId = body.place.placeId.trim();
  const existing = placeCandidates.find(
    (candidate) => candidate.placeId === normalizedPlaceId
  );

  if (existing) {
    return NextResponse.json({ id: existing.id, reused: true });
  }

  const MAX_PLACE_CANDIDATES = 5;

  const createPayload = {
    eventId: id,
    placeId: normalizedPlaceId,
    name: body.place.name,
    address: body.place.address,
    lat: body.place.lat,
    lng: body.place.lng,
    priceLevel: body.place.priceLevel,
    score: 0,
    source: "proposal" as const,
    proposedBy: body.userId,
  };

  if (placeCandidates.length < MAX_PLACE_CANDIDATES) {
    const created = await prisma.eventPlaceCandidate.create({ data: createPayload });
    return NextResponse.json({ id: created.id });
  }

  const aggregateScore = (candidate: {
    score: number;
    createdAt: Date;
    votes: Array<{ score: number }>;
  }) => ({
    total:
      candidate.score +
      candidate.votes.reduce((acc, vote) => acc + vote.score, 0),
    badCount: candidate.votes.filter((vote) => vote.score <= 2).length,
    goodCount: candidate.votes.filter((vote) => vote.score >= 4).length,
  });

  const candidatePriority = (candidate: {
    score: number;
    createdAt: Date;
    votes: Array<{ score: number }>;
  }) => {
    const aggregate = aggregateScore(candidate);
    return {
      noGood: aggregate.goodCount === 0 ? 0 : 1,
      badCount: -aggregate.badCount,
      totalScore: aggregate.total,
      createdAt: candidate.createdAt.getTime(),
    };
  };

  const sortForReplacement = <T extends {
    score: number;
    createdAt: Date;
    votes: Array<{ score: number }>;
  }>(candidates: T[]) =>
    [...candidates].sort((a, b) => {
      const pa = candidatePriority(a);
      const pb = candidatePriority(b);

      if (pa.noGood !== pb.noGood) return pa.noGood - pb.noGood;
      if (pa.badCount !== pb.badCount) return pa.badCount - pb.badCount;
      if (pa.totalScore !== pb.totalScore) return pa.totalScore - pb.totalScore;
      return pa.createdAt - pb.createdAt;
    });

  const systemCandidates = placeCandidates.filter((candidate) => candidate.source === "system");

  const replacementTarget =
    sortForReplacement(systemCandidates)[0] ??
    sortForReplacement(placeCandidates)[0];

  if (!replacementTarget) {
    return NextResponse.json(
      { message: "No replaceable place candidate found" },
      { status: 409 }
    );
  }

  const replaced = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.eventPlaceCandidate.delete({ where: { id: replacementTarget.id } });
    return tx.eventPlaceCandidate.create({ data: createPayload });
  });

  return NextResponse.json({ id: replaced.id, replacedCandidateId: replacementTarget.id });
}
