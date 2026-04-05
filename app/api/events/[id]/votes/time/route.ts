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
    isAvailable?: boolean;
  };

  if (!body.userId || !body.candidateId) {
    return NextResponse.json(
      { message: "userId and candidateId are required" },
      { status: 400 }
    );
  }

  const vote = await prisma.eventTimeVote.upsert({
    where: {
      candidateId_userId: {
        candidateId: body.candidateId,
        userId: body.userId,
      },
    },
    update: {
      isAvailable: body.isAvailable ?? true,
    },
    create: {
      candidateId: body.candidateId,
      userId: body.userId,
      isAvailable: body.isAvailable ?? true,
    },
  });

  return NextResponse.json({ id: vote.candidateId });
}
