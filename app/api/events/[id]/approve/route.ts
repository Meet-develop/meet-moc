import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as { ownerId?: string; userId?: string };

  if (!body.ownerId || !body.userId) {
    return NextResponse.json(
      { message: "ownerId and userId are required" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== body.ownerId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const participant = await prisma.eventParticipant.update({
    where: { eventId_userId: { eventId: id, userId: body.userId } },
    data: { status: "approved" },
  });

  return NextResponse.json({ status: participant.status });
}
