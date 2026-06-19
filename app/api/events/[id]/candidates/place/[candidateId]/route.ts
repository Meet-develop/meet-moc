import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  const { id, candidateId } = await params;
  const body = (await request.json()) as { userId?: string };

  if (!body.userId) {
    return NextResponse.json({ message: "userId is required" }, { status: 400 });
  }

  const [event, candidate] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      select: { status: true, ownerId: true },
    }),
    prisma.eventPlaceCandidate.findUnique({
      where: { id: candidateId },
      select: { eventId: true, proposedBy: true },
    }),
  ]);

  if (!event || !candidate || candidate.eventId !== id) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (event.status !== "open") {
    return NextResponse.json(
      { message: "Only open events can have candidates removed" },
      { status: 400 }
    );
  }

  const isOwner = event.ownerId === body.userId;
  const isProposer = candidate.proposedBy === body.userId;

  if (!isOwner && !isProposer) {
    return NextResponse.json({ message: "Not authorized" }, { status: 403 });
  }

  await prisma.eventPlaceCandidate.delete({ where: { id: candidateId } });

  return NextResponse.json({ success: true });
}
