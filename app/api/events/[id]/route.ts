import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlacePhotoUrlByPlaceId } from "@/lib/places";
import { createAppNotifications } from "@/lib/notification-delivery";

const PUBLIC_EVENT_DETAIL_CACHE_CONTROL =
  "public, s-maxage=60, stale-while-revalidate=300";
const PRIVATE_EVENT_DETAIL_CACHE_CONTROL =
  "private, max-age=15, stale-while-revalidate=60";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const viewerId = searchParams.get("viewerId");
  const cacheControl = viewerId
    ? PRIVATE_EVENT_DETAIL_CACHE_CONTROL
    : PUBLIC_EVENT_DETAIL_CACHE_CONTROL;
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      owner: true,
      participants: { include: { user: true } },
      inviteRequests: {
        where: { status: "pending" },
        include: { requester: true, invitee: true },
        orderBy: { createdAt: "desc" },
      },
      invites: {
        include: { inviter: true, invitee: true },
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

  const participantUserIds = new Set(participants.map((participant) => participant.userId));

  const pendingInviteeIds = new Set<string>();
  const invitedUsers = event.invites
    .filter((invite) => {
      if (invite.status !== "pending") return false;
      if (!invite.inviteeId) return false;
      if (participantUserIds.has(invite.inviteeId)) return false;
      if (pendingInviteeIds.has(invite.inviteeId)) return false;
      pendingInviteeIds.add(invite.inviteeId);
      return true;
    })
    .map((invite) => ({
      userId: invite.inviteeId as string,
      displayName: invite.invitee?.displayName ?? "招待中ユーザー",
      avatarIcon: invite.invitee?.avatarIcon ?? null,
      status: "requested" as const,
      role: "guest" as const,
      invitedBy: {
        userId: invite.inviter.userId,
        displayName: invite.inviter.displayName,
        avatarIcon: invite.inviter.avatarIcon,
      },
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
  const eventComment = (event as { comment?: string | null }).comment ?? null;

  const inviteRequests = ((event as { inviteRequests?: Array<{
    id: string;
    requester: { userId: string; displayName: string; avatarIcon?: string | null };
    invitee: { userId: string; displayName: string; avatarIcon?: string | null };
    createdAt: Date;
  }> }).inviteRequests ?? []).map((request) => ({
    id: request.id,
    requester: {
      userId: request.requester.userId,
      displayName: request.requester.displayName,
      avatarIcon: request.requester.avatarIcon,
    },
    invitee: {
      userId: request.invitee.userId,
      displayName: request.invitee.displayName,
      avatarIcon: request.invitee.avatarIcon,
    },
    createdAt: request.createdAt,
  }));

  return NextResponse.json(
    {
      id: event.id,
      purpose: event.purpose,
      comment: eventComment,
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
      invitedUsers,
      inviteRequests,
      timeCandidates,
      placeCandidates,
    },
    {
      headers: {
        "Cache-Control": cacheControl,
      },
    }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    ownerId?: string;
    purpose?: string;
    comment?: string;
    eventArea?: string;
    visibility?: "public" | "limited" | "private";
    capacity?: number;
    timeSetting?: "auto" | "manual";
    placeSetting?: "auto" | "manual";
    fixedStartTime?: string;
    fixedPlace?: {
      placeId?: string;
      name?: string;
      address?: string;
    } | null;
  };

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

  const updateData: {
    purpose?: string;
    comment?: string | null;
    area?: string | null;
    visibility?: "public" | "limited" | "private";
    capacity?: number;
    scheduleMode?: "fixed" | "candidate";
    fixedStartTime?: Date | null;
    fixedEndTime?: Date | null;
    fixedPlaceId?: string | null;
    fixedPlaceName?: string | null;
    fixedPlaceAddress?: string | null;
  } = {};

  if (typeof body.purpose === "string" && body.purpose.trim().length > 0) {
    updateData.purpose = body.purpose.trim();
  }

  if (typeof body.comment === "string") {
    const normalizedComment = body.comment.trim();
    updateData.comment = normalizedComment.length > 0 ? normalizedComment : null;
  }

  if (typeof body.eventArea === "string") {
    const normalizedArea = body.eventArea.trim();
    updateData.area = normalizedArea.length > 0 ? normalizedArea : null;
  }

  if (
    body.visibility === "public" ||
    body.visibility === "limited" ||
    body.visibility === "private"
  ) {
    updateData.visibility = body.visibility;
  }

  if (typeof body.capacity === "number" && Number.isFinite(body.capacity)) {
    updateData.capacity = Math.max(2, Math.floor(body.capacity));
  }

  if (body.timeSetting === "manual") {
    updateData.scheduleMode = "fixed";
    if (body.fixedStartTime) {
      const fixedStartTime = new Date(body.fixedStartTime);
      if (!Number.isNaN(fixedStartTime.getTime())) {
        updateData.fixedStartTime = fixedStartTime;
        updateData.fixedEndTime = new Date(
          fixedStartTime.getTime() + 2 * 60 * 60 * 1000
        );
      }
    }
  } else if (body.timeSetting === "auto") {
    updateData.scheduleMode = "candidate";
    updateData.fixedStartTime = null;
    updateData.fixedEndTime = null;
  }

  if (body.placeSetting === "manual") {
    updateData.fixedPlaceId = body.fixedPlace?.placeId ?? null;
    updateData.fixedPlaceName = body.fixedPlace?.name ?? null;
    updateData.fixedPlaceAddress = body.fixedPlace?.address ?? null;
  } else if (body.placeSetting === "auto") {
    updateData.fixedPlaceId = null;
    updateData.fixedPlaceName = null;
    updateData.fixedPlaceAddress = null;
  }

  let updated;
  try {
    updated = await prisma.event.update({
      where: { id },
      data: updateData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Unknown argument `area`")) {
      const fallbackData = { ...updateData };
      delete fallbackData.area;
      updated = await prisma.event.update({
        where: { id },
        data: fallbackData,
      });
    } else {
      throw error;
    }
  }

  const notifyUserIds = event.participants
    .filter(
      (participant) =>
        participant.userId !== event.ownerId && participant.status === "approved"
    )
    .map((participant) => participant.userId);

  if (notifyUserIds.length > 0) {
    await createAppNotifications(
      notifyUserIds.map((userId) => ({
        userId,
        type: "event_confirmed",
        title: "イベント情報が更新されました",
        body: `「${updated.purpose}」の内容が更新されました。`,
        message: `「${updated.purpose}」の内容が更新されました。`,
        eventId: updated.id,
      }))
    );
  }

  return NextResponse.json({ success: true, eventId: updated.id });
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

  if (notifyUserIds.length > 0) {
    await createAppNotifications(
      notifyUserIds.map((userId) => ({
        userId,
        type: "invite_received",
        title: "イベントが削除されました",
        body: `「${event.purpose}」は主催者により削除されました。`,
        message: `「${event.purpose}」は主催者により削除されました。`,
      }))
    );
  }

  await prisma.event.delete({ where: { id: event.id } });

  return NextResponse.json({ deleted: true });
}
