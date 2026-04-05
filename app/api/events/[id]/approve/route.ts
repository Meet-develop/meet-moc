import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncApprovedEventFriendships } from "@/lib/event-friendships";
import { createAppNotification } from "@/lib/notification-delivery";

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

  const [approvedEvent, owner, requester] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      select: { id: true, purpose: true },
    }),
    prisma.profile.findUnique({
      where: { userId: body.ownerId },
      select: { displayName: true },
    }),
    prisma.profile.findUnique({
      where: { userId: body.userId },
      select: { userId: true },
    }),
  ]);

  if (approvedEvent && requester) {
    const ownerName = owner?.displayName ?? "オーナー";
    await createAppNotification({
      userId: requester.userId,
      type: "join_approved",
      title: "参加申請が承認されました",
      body: `${ownerName}さんが「${approvedEvent.purpose}」への参加申請を承認しました。`,
      message: `${ownerName}さんが「${approvedEvent.purpose}」への参加申請を承認しました。`,
      eventId: approvedEvent.id,
    });
  }

  await syncApprovedEventFriendships(id);

  return NextResponse.json({ status: participant.status });
}
