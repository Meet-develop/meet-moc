import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as { userId?: string };

  if (!body.userId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: { participants: true },
  });

  if (!event) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const approvedCount = event.participants.filter(
    (participant) => participant.status === "approved"
  ).length;

  const shouldAutoApprove =
    event.visibility !== "private" && approvedCount < event.capacity;

  const participant = await prisma.eventParticipant.upsert({
    where: { eventId_userId: { eventId: id, userId: body.userId } },
    update: { status: shouldAutoApprove ? "approved" : "requested" },
    create: {
      eventId: id,
      userId: body.userId,
      status: shouldAutoApprove ? "approved" : "requested",
      role: "guest",
    },
  });

  return NextResponse.json({ status: participant.status });
}
