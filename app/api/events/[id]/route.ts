import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlacePhotoUrlByPlaceId } from "@/lib/places";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const viewerId = searchParams.get("viewerId");
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      owner: true,
      participants: { include: { user: true } },
      invites: {
        include: { inviter: true },
        orderBy: { createdAt: "desc" },
      },
      timeCandidates: { include: { votes: true } },
      placeCandidates: { include: { votes: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const inviterByInviteeId = new Map<
    string,
    { userId: string; displayName: string; avatarIcon?: string | null }
  >();

  for (const invite of event.invites) {
    if (!invite.inviteeId) continue;
    if (invite.status === "declined") continue;
    if (inviterByInviteeId.has(invite.inviteeId)) continue;

    inviterByInviteeId.set(invite.inviteeId, {
      userId: invite.inviter.userId,
      displayName: invite.inviter.displayName,
      avatarIcon: invite.inviter.avatarIcon,
    });
  }

  const participants = event.participants.map((participant) => ({
    userId: participant.userId,
    displayName: participant.user.displayName,
    avatarIcon: participant.user.avatarIcon,
    status: participant.status,
    role: participant.role,
    invitedBy: inviterByInviteeId.get(participant.userId) ?? null,
  }));

  const timeCandidates = event.timeCandidates
    .map((candidate) => {
      const availableVotes = candidate.votes.filter((vote) => vote.isAvailable).length;
      const myVote = viewerId
        ? candidate.votes.find((vote) => vote.userId === viewerId)
        : undefined;
      return {
        id: candidate.id,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        score: candidate.score + availableVotes,
        source: candidate.source,
        proposedBy: candidate.proposedBy,
        availableVotes,
        myAvailability: myVote?.isAvailable ?? null,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const placeCandidates = (
    await Promise.all(
      event.placeCandidates.map(async (candidate) => {
        const totalScore = candidate.votes.reduce((acc, vote) => acc + vote.score, 0);
        const myVote = viewerId
          ? candidate.votes.find((vote) => vote.userId === viewerId)
          : undefined;
        const photoUrl = await getPlacePhotoUrlByPlaceId(candidate.placeId);
        return {
          id: candidate.id,
          placeId: candidate.placeId,
          name: candidate.name,
          address: candidate.address,
          lat: candidate.lat,
          lng: candidate.lng,
          photoUrl,
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${candidate.lat},${candidate.lng}`
          )}&query_place_id=${encodeURIComponent(candidate.placeId)}`,
          priceLevel: candidate.priceLevel,
          score: candidate.score + totalScore,
          source: candidate.source,
          proposedBy: candidate.proposedBy,
          myScore: myVote?.score ?? null,
        };
      })
    )
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const eventArea = (event as { area?: string | null }).area ?? null;

  return NextResponse.json({
    id: event.id,
    purpose: event.purpose,
    area: eventArea,
    visibility: event.visibility,
    capacity: event.capacity,
    status: event.status,
    scheduleMode: event.scheduleMode,
    fixedStartTime: event.fixedStartTime,
    fixedEndTime: event.fixedEndTime,
    fixedPlaceId: event.fixedPlaceId,
    fixedPlaceName: event.fixedPlaceName,
    fixedPlaceAddress: event.fixedPlaceAddress,
    owner: {
      userId: event.owner.userId,
      displayName: event.owner.displayName,
      avatarIcon: event.owner.avatarIcon,
    },
    participants,
    timeCandidates,
    placeCandidates,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as { ownerId?: string };

  if (!body.ownerId) {
    return NextResponse.json({ message: "Missing ownerId" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      participants: true,
    },
  });

  if (!event) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (event.ownerId !== body.ownerId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const notifyUserIds = event.participants
    .filter(
      (participant) =>
        participant.userId !== event.ownerId &&
        participant.status !== "declined" &&
        participant.status !== "cancelled"
    )
    .map((participant) => participant.userId);

  await prisma.$transaction(async (tx) => {
    if (notifyUserIds.length > 0) {
      await tx.notification.createMany({
        data: notifyUserIds.map((userId) => ({
          userId,
          type: "invite_received",
          message: `「${event.purpose}」は主催者により削除されました。`,
        })),
      });
    }

    await tx.event.delete({ where: { id: event.id } });
  });

  return NextResponse.json({ deleted: true });
}
