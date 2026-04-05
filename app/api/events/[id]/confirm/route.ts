import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAppNotifications } from "@/lib/notification-delivery";

const formatConfirmedInfo = (
  startTime?: Date | null,
  placeName?: string | null
) => {
  const dateLabel = startTime
    ? new Date(startTime).toLocaleString("ja-JP", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "日程未設定";
  const placeLabel = placeName ?? "場所未設定";
  return `${dateLabel} / ${placeLabel}`;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    ownerId?: string;
    timeCandidateId?: string;
    placeCandidateId?: string;
  };

  if (!body.ownerId) {
    return NextResponse.json({ message: "Missing ownerId" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: { participants: true },
  });
  if (!event || event.ownerId !== body.ownerId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (event.status === "completed" || event.status === "cancelled") {
    return NextResponse.json(
      { message: "Completed or cancelled event cannot be updated" },
      { status: 400 }
    );
  }

  const timeCandidate = body.timeCandidateId
    ? await prisma.eventTimeCandidate.findUnique({
        where: { id: body.timeCandidateId },
      })
    : null;
  const placeCandidate = body.placeCandidateId
    ? await prisma.eventPlaceCandidate.findUnique({
        where: { id: body.placeCandidateId },
      })
    : null;

  if (timeCandidate && timeCandidate.eventId !== id) {
    return NextResponse.json({ message: "Invalid timeCandidateId" }, { status: 400 });
  }
  if (placeCandidate && placeCandidate.eventId !== id) {
    return NextResponse.json({ message: "Invalid placeCandidateId" }, { status: 400 });
  }

  const nextFixedStartTime = timeCandidate?.startTime ?? event.fixedStartTime;
  const nextFixedEndTime = timeCandidate?.endTime ?? event.fixedEndTime;
  const nextFixedPlaceId = placeCandidate?.placeId ?? event.fixedPlaceId;
  const nextFixedPlaceName = placeCandidate?.name ?? event.fixedPlaceName;
  const nextFixedPlaceAddress = placeCandidate?.address ?? event.fixedPlaceAddress;

  const wasConfirmed = event.status === "confirmed";
  const didTimeChange =
    (event.fixedStartTime?.getTime() ?? null) !==
      (nextFixedStartTime?.getTime() ?? null) ||
    (event.fixedEndTime?.getTime() ?? null) !== (nextFixedEndTime?.getTime() ?? null);
  const didPlaceChange =
    event.fixedPlaceId !== nextFixedPlaceId ||
    event.fixedPlaceName !== nextFixedPlaceName ||
    event.fixedPlaceAddress !== nextFixedPlaceAddress;
  const didConfirmedInfoChange = didTimeChange || didPlaceChange;

  const updated = await prisma.event.update({
    where: { id },
    data: {
      status: "confirmed",
      fixedStartTime: nextFixedStartTime,
      fixedEndTime: nextFixedEndTime,
      fixedPlaceId: nextFixedPlaceId,
      fixedPlaceName: nextFixedPlaceName,
      fixedPlaceAddress: nextFixedPlaceAddress,
    },
  });

  const notifyUserIds = event.participants
    .filter(
      (participant) =>
        participant.status === "approved" && participant.userId !== event.ownerId
    )
    .map((participant) => participant.userId);

  if (notifyUserIds.length > 0) {
    const confirmedInfo = formatConfirmedInfo(
      nextFixedStartTime,
      nextFixedPlaceName
    );

    const shouldNotifyConfirmed = !wasConfirmed;
    const shouldNotifyUpdated = wasConfirmed && didConfirmedInfoChange;

    if (shouldNotifyConfirmed || shouldNotifyUpdated) {
      const message = shouldNotifyConfirmed
        ? `「${event.purpose}」の開催情報が確定しました（${confirmedInfo}）。`
        : `「${event.purpose}」の確定情報が更新されました（${confirmedInfo}）。`;

      await createAppNotifications(
        notifyUserIds.map((userId) => ({
          userId,
          type: "event_confirmed",
          title: shouldNotifyConfirmed
            ? "開催情報が確定しました"
            : "開催情報が更新されました",
          body: message,
          message,
          eventId: event.id,
        }))
      );
    }
  }

  return NextResponse.json({ status: updated.status });
}
