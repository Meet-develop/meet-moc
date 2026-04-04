import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  await _params;
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
