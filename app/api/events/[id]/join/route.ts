import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncApprovedEventFriendships } from "@/lib/event-friendships";
import { createAppNotification } from "@/lib/notification-delivery";

const needsOwnerApprovalByDeadline = (event: {
  scheduleMode: "fixed" | "candidate";
  status: "open" | "confirmed" | "completed" | "cancelled";
  fixedStartTime: Date | null;
  timeCandidates: Array<{ startTime: Date }>;
}) => {
  const now = Date.now();

  if (event.status === "cancelled") {
    return true;
  }

  if (event.scheduleMode === "fixed") {
    if (!event.fixedStartTime) {
      return false;
    }
    const deadline = new Date(event.fixedStartTime);
    deadline.setDate(deadline.getDate() - 1);
    return now > deadline.getTime();
  }

  if (event.status !== "open") {
    return true;
  }

  const candidateStarts = event.timeCandidates
    .map((candidate) => candidate.startTime.getTime())
    .filter((timestamp) => Number.isFinite(timestamp));

  const firstStart =
    event.fixedStartTime != null
      ? event.fixedStartTime.getTime()
      : candidateStarts.length > 0
        ? Math.min(...candidateStarts)
        : now + 7 * 24 * 60 * 60 * 1000;

  const deadline = new Date(firstStart);
  deadline.setDate(deadline.getDate() - 1);
  return now > deadline.getTime();
};

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
    include: {
      participants: true,
      owner: {
        select: { displayName: true },
      },
      timeCandidates: {
        select: { startTime: true },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const approvedCount = event.participants.filter(
    (participant: { status: string }) => participant.status === "approved"
  ).length;

  const existingParticipant = event.participants.find(
    (participant: { userId: string }) => participant.userId === body.userId
  );

  const pendingInvite = await prisma.eventInvite.findFirst({
    where: {
      eventId: id,
      inviteeId: body.userId,
      status: "pending",
    },
  });

  const isInvitedByOwner =
    pendingInvite && pendingInvite.inviterId === event.ownerId;

  const overCapacity = approvedCount >= event.capacity;
  const requiresApprovalByDeadline = needsOwnerApprovalByDeadline(event);
  const requiresApprovalByVisibility =
    (event.visibility === "limited" || event.visibility === "private") &&
    !isInvitedByOwner;

  const shouldAutoApprove =
    !overCapacity && !requiresApprovalByDeadline && !requiresApprovalByVisibility;

  const nextStatus = shouldAutoApprove ? "approved" : "requested";

  if (pendingInvite) {
    await prisma.eventInvite.update({
      where: { id: pendingInvite.id },
      data: { status: "accepted" },
    });
  }

  const participant = await prisma.eventParticipant.upsert({
    where: { eventId_userId: { eventId: id, userId: body.userId } },
    update: { status: nextStatus },
    create: {
      eventId: id,
      userId: body.userId,
      status: nextStatus,
      role: "guest",
    },
  });

  if (
    participant.status === "requested" &&
    existingParticipant?.status !== "requested"
  ) {
    const requester = await prisma.profile.findUnique({
      where: { userId: body.userId },
      select: { displayName: true },
    });

    const requesterName = requester?.displayName ?? "参加希望ユーザー";

    await createAppNotification({
      userId: event.ownerId,
      type: "join_requested",
      title: "参加申請のお知らせ",
      body: `${requesterName}さんが「${event.purpose}」への参加をリクエストしました。`,
      message: `${requesterName}さんが「${event.purpose}」への参加をリクエストしました。`,
      eventId: event.id,
    });
  }

  if (participant.status === "approved") {
    await syncApprovedEventFriendships(id);
  }

  return NextResponse.json({ status: participant.status });
}
