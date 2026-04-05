import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlacesForQuery } from "@/lib/places";

const dayIndex: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const weekdayKeyByIndex: Record<number, "mon" | "tue" | "wed" | "thu" | "fri" | undefined> = {
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
};

const buildDefaultTimeCandidates = (availability?: {
  weekdaySlots?: Record<string, { daytime?: boolean; night?: boolean }>;
  days?: string[];
  timeRanges?: { start: string; end: string }[];
}) => {
  const now = new Date();
  const weekdaySlots = availability?.weekdaySlots;
  const candidates: { startTime: Date; endTime: Date; score: number; source: "system" }[] = [];

  if (weekdaySlots) {
    let offset = 1;
    while (candidates.length < 3 && offset < 21) {
      const date = new Date(now);
      date.setDate(now.getDate() + offset);
      const dayKey = weekdayKeyByIndex[date.getDay()];
      if (!dayKey) {
        offset += 1;
        continue;
      }

      const slot = weekdaySlots[dayKey];
      if (!slot?.daytime && !slot?.night) {
        offset += 1;
        continue;
      }

      if (slot.daytime && candidates.length < 3) {
        const start = new Date(date);
        start.setHours(13, 0, 0, 0);
        const end = new Date(start);
        end.setHours(15, 0, 0, 0);
        candidates.push({ startTime: start, endTime: end, score: 0, source: "system" });
      }

      if (slot.night && candidates.length < 3) {
        const start = new Date(date);
        start.setHours(19, 30, 0, 0);
        const end = new Date(start);
        end.setHours(21, 30, 0, 0);
        candidates.push({ startTime: start, endTime: end, score: 0, source: "system" });
      }

      offset += 1;
    }
  }

  if (candidates.length > 0) {
    return candidates.slice(0, 3);
  }

  const startRange = availability?.timeRanges?.[0]?.start ?? "19:00";
  const endRange = availability?.timeRanges?.[0]?.end ?? "22:00";
  const availableDays = availability?.days?.map((day) => dayIndex[day]).filter((day) => day !== undefined);
  let offset = 1;

  while (candidates.length < 3 && offset < 14) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    if (availableDays && availableDays.length > 0 && !availableDays.includes(date.getDay())) {
      offset += 1;
      continue;
    }

    const [startHour, startMinute] = startRange.split(":").map(Number);
    const [endHour, endMinute] = endRange.split(":").map(Number);
    const start = new Date(date);
    start.setHours(startHour || 19, startMinute || 0, 0, 0);
    const end = new Date(date);
    end.setHours(endHour || 22, endMinute || 0, 0, 0);

    candidates.push({ startTime: start, endTime: end, score: 0, source: "system" });
    offset += 1;
  }

  if (candidates.length === 0) {
    const fallback = new Date(now);
    fallback.setDate(now.getDate() + 1);
    fallback.setHours(19, 0, 0, 0);
    const end = new Date(fallback);
    end.setHours(22, 0, 0, 0);
    return [{ startTime: fallback, endTime: end, score: 0, source: "system" as const }];
  }

  return candidates;
};

const buildPlaceCandidates = async (query: string) => {
  const places = await getPlacesForQuery(query);
  const normalized = places.slice(0, 3).map((place) => ({
    placeId: place.placeId,
    name: place.name,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    priceLevel: place.priceLevel,
    score: 0,
    source: "system" as const,
  }));

  if (normalized.length > 0) {
    return normalized;
  }

  return Array.from({ length: 3 }).map((_, index) => ({
    placeId: `${query}-fallback-${index + 1}`,
    name: `${query} 候補${index + 1}`,
    address: "未設定",
    lat: 0,
    lng: 0,
    priceLevel: undefined,
    score: 0,
    source: "system" as const,
  }));
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const viewerId = searchParams.get("viewerId");

  const events = await prisma.event.findMany({
    include: {
      owner: true,
      participants: true,
      invites: true,
      timeCandidates: true,
      placeCandidates: true,
    },
    orderBy: { createdAt: "desc" },
  });

  let favoriteOwnerIds = new Set<string>();
  if (viewerId) {
    const favorites = await prisma.favoriteFriend.findMany({
      where: { userId: viewerId },
      select: { favoriteUserId: true },
    });
    favoriteOwnerIds = new Set(favorites.map((favorite) => favorite.favoriteUserId));
  }

  const formatted = events
    .filter((event) => {
      if (!viewerId) {
        return event.visibility === "public";
      }

      const isOwner = event.ownerId === viewerId;
      const isParticipant = event.participants.some((participant) => participant.userId === viewerId);
      const isInvited = event.invites.some((invite) => invite.inviteeId === viewerId);
      return event.visibility === "public" || isOwner || isParticipant || isInvited;
    })
    .map((event) => {
      const approvedCount = event.participants.filter(
        (participant) => participant.status === "approved"
      ).length;
      const isOwner = viewerId ? event.ownerId === viewerId : false;
      const isJoinedParticipant = viewerId
        ? event.participants.some(
            (participant) =>
              participant.userId === viewerId &&
              participant.status !== "declined" &&
              participant.status !== "cancelled"
          )
        : false;
      const pendingInvite = viewerId
        ? event.invites.find(
            (invite) => invite.inviteeId === viewerId && (invite.status === "pending" || invite.status === "accepted")
          )
        : undefined;
      const timeCandidates = [...event.timeCandidates]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((candidate) => ({
          id: candidate.id,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          score: candidate.score,
        }));
      const placeCandidates = [...event.placeCandidates]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          address: candidate.address,
          score: candidate.score,
        }));

      return {
        id: event.id,
        purpose: event.purpose,
        visibility: event.visibility,
        capacity: event.capacity,
        status: event.status,
        scheduleMode: event.scheduleMode,
        fixedStartTime: event.fixedStartTime,
        fixedEndTime: event.fixedEndTime,
        fixedPlaceName: event.fixedPlaceName,
        owner: {
          userId: event.owner.userId,
          displayName: event.owner.displayName,
          avatarIcon: event.owner.avatarIcon,
        },
        approvedCount,
        timeCandidates,
        placeCandidates,
        isFavoriteOwner: viewerId ? favoriteOwnerIds.has(event.ownerId) : false,
        viewerRelation: isOwner || isJoinedParticipant
          ? "participating"
          : pendingInvite
            ? "invited"
            : "public",
        createdAt: event.createdAt,
      };
    })
    .sort((a, b) => {
      if (a.isFavoriteOwner && !b.isFavoriteOwner) return -1;
      if (!a.isFavoriteOwner && b.isFavoriteOwner) return 1;
      return 0;
    });

  const participating = formatted.filter((event) => event.viewerRelation === "participating");
  const invited = formatted.filter((event) => event.viewerRelation === "invited");
  const publicEvents = formatted.filter((event) => event.viewerRelation === "public");

  return NextResponse.json(
    {
      participating,
      invited,
      public: publicEvents,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    ownerId?: string;
    purpose?: string;
    visibility?: "public" | "limited" | "private";
    capacity?: number;
    scheduleMode?: "fixed" | "candidate";
    timeSetting?: "auto" | "manual";
    placeSetting?: "auto" | "manual";
    fixedStartTime?: string;
    fixedPlace?: {
      placeId: string;
      name: string;
      address: string;
    };
    placeQuery?: string;
    candidatePlaces?: {
      placeId: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
      priceLevel?: number;
    }[];
    inviteeIds?: string[];
  };

  if (!body.ownerId || !body.purpose || body.capacity == null) {
    return NextResponse.json(
      { message: "ownerId, purpose, capacity are required" },
      { status: 400 }
    );
  }

  const legacyFixed = body.scheduleMode === "fixed";
  const isTimeManual = body.timeSetting
    ? body.timeSetting === "manual"
    : legacyFixed;
  const isPlaceManual = body.placeSetting
    ? body.placeSetting === "manual"
    : legacyFixed;
  const resolvedScheduleMode =
    isTimeManual && isPlaceManual ? "fixed" : "candidate";

  if (isTimeManual && !body.fixedStartTime) {
    return NextResponse.json(
      { message: "fixedStartTime is required when timeSetting is manual" },
      { status: 400 }
    );
  }

  if (isPlaceManual && !body.fixedPlace) {
    return NextResponse.json(
      { message: "fixedPlace is required when placeSetting is manual" },
      { status: 400 }
    );
  }

  const fixedStartDate = body.fixedStartTime ? new Date(body.fixedStartTime) : undefined;
  const fixedEndDate = fixedStartDate
    ? new Date(fixedStartDate.getTime() + 2 * 60 * 60 * 1000)
    : undefined;

  const event = await prisma.event.create({
    data: {
      ownerId: body.ownerId,
      purpose: body.purpose,
      visibility: body.visibility ?? "public",
      capacity: body.capacity,
      scheduleMode: resolvedScheduleMode,
      fixedStartTime: fixedStartDate,
      fixedEndTime: fixedEndDate,
      fixedPlaceId: body.fixedPlace?.placeId,
      fixedPlaceName: body.fixedPlace?.name,
      fixedPlaceAddress: body.fixedPlace?.address,
    },
  });

  await prisma.eventParticipant.create({
    data: {
      eventId: event.id,
      userId: body.ownerId,
      status: "approved",
      role: "owner",
    },
  });

  if (resolvedScheduleMode === "candidate") {
    const ownerProfile = await prisma.profile.findUnique({
      where: { userId: body.ownerId },
    });
    if (!isTimeManual) {
      const timeCandidates = buildDefaultTimeCandidates(
        ownerProfile?.availability as
          | {
              weekdaySlots?: Record<string, { daytime?: boolean; night?: boolean }>;
              days?: string[];
              timeRanges?: { start: string; end: string }[];
            }
          | undefined
      );
      await prisma.eventTimeCandidate.createMany({
        data: timeCandidates.map((candidate) => ({
          eventId: event.id,
          ...candidate,
        })),
      });
    }

    if (!isPlaceManual) {
      const fallbackQuery = ownerProfile?.favoriteAreas?.[0]
        ? `${ownerProfile.favoriteAreas[0]} ${body.purpose}`
        : body.purpose;
      const query = body.placeQuery ?? fallbackQuery;

      if (body.candidatePlaces && body.candidatePlaces.length > 0) {
        await prisma.eventPlaceCandidate.createMany({
          data: body.candidatePlaces.slice(0, 5).map((candidate) => ({
            eventId: event.id,
            placeId: candidate.placeId,
            name: candidate.name,
            address: candidate.address,
            lat: candidate.lat,
            lng: candidate.lng,
            priceLevel: candidate.priceLevel,
            score: 0,
            source: "system",
          })),
        });
      } else if (query) {
        const placeCandidates = await buildPlaceCandidates(query);
        if (placeCandidates.length > 0) {
          await prisma.eventPlaceCandidate.createMany({
            data: placeCandidates.map((candidate) => ({
              eventId: event.id,
              ...candidate,
            })),
          });
        }
      }
    }
  }

  if (body.inviteeIds && body.inviteeIds.length > 0) {
    await prisma.eventInvite.createMany({
      data: body.inviteeIds.map((inviteeId) => ({
        eventId: event.id,
        inviterId: body.ownerId as string,
        inviteeId,
        token: crypto.randomUUID(),
        status: "pending" as const,
      })),
    });
  }

  return NextResponse.json({ id: event.id });
}
