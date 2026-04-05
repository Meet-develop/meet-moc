import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type LeaveEventBody = {
  userId?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as LeaveEventBody;

  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.ownerId === body.userId) {
    return NextResponse.json(
      { error: "Owner cannot leave their own event" },
      { status: 400 }
    );
  }

  const participant = await prisma.eventParticipant.findUnique({
    where: { eventId_userId: { eventId: id, userId: body.userId } },
  });

  if (!participant || participant.status !== "approved") {
    return NextResponse.json(
      { error: "Approved participant not found" },
      { status: 404 }
    );
  }

  await prisma.eventParticipant.update({
    where: { eventId_userId: { eventId: id, userId: body.userId } },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ success: true });
}
