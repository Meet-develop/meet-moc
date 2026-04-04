import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await prisma.eventInvite.findUnique({
    where: { token },
    include: { event: true, inviter: true },
  });

  if (!invite) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    eventId: invite.eventId,
    purpose: invite.event.purpose,
    inviter: invite.inviter.displayName,
    inviterAvatarIcon: invite.inviter.avatarIcon,
    status: invite.status,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = (await request.json()) as { userId?: string };

  if (!body.userId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  const invite = await prisma.eventInvite.findUnique({
    where: { token },
    include: { event: true },
  });

  if (!invite) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  await prisma.eventInvite.update({
    where: { token },
    data: { status: "accepted", inviteeId: body.userId },
  });

  await prisma.eventParticipant.upsert({
    where: { eventId_userId: { eventId: invite.eventId, userId: body.userId } },
    update: { status: "approved" },
    create: {
      eventId: invite.eventId,
      userId: body.userId,
      status: "approved",
      role: "guest",
    },
  });

  return NextResponse.json({ ok: true });
}
