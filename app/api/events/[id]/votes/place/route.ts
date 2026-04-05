import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    userId?: string;
    candidateId?: string;
    score?: number;
  };

  if (!body.userId || !body.candidateId) {
    return NextResponse.json(
      { message: "userId and candidateId are required" },
      { status: 400 }
    );
  }

  const score = body.score ?? 3;

  const [candidate, participant] = await Promise.all([
    prisma.eventPlaceCandidate.findUnique({
      where: { id: body.candidateId },
      select: { eventId: true },
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

  if (!candidate || candidate.eventId !== id) {
    return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
  }

  if (!participant || participant.status !== "approved") {
    return NextResponse.json(
      { message: "Only approved participants can vote" },
      { status: 403 }
    );
  }

  const vote = await prisma.eventPlaceVote.upsert({
    where: {
      candidateId_userId: {
        candidateId: body.candidateId,
        userId: body.userId,
      },
    },
    update: {
      score,
    },
    create: {
      candidateId: body.candidateId,
      userId: body.userId,
      score,
    },
  });

  return NextResponse.json({ id: vote.candidateId });
}
