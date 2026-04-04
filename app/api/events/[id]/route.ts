import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const fallbackAvatar =
  "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

const formatTime = (value: Date) => value.toTimeString().slice(0, 5);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: true,
      hashtags: true,
      participants: { include: { user: true } },
      dateOptions: { include: { participants: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const participants = event.participants.map((participant) => ({
    id: participant.userId,
    name: participant.user.username,
    avatarUrl: participant.user.avatarUrl ?? fallbackAvatar,
    joinedAt: participant.joinedAt.toISOString(),
    status: participant.status,
  }));

  const dateOptions = event.dateOptions.map((option) => ({
    id: option.id,
    date: option.optionDate.toISOString(),
    startTime: formatTime(option.startTime),
    endTime: formatTime(option.endTime),
    availableParticipants: option.participants.map(
      (participant) => participant.userId
    ),
  }));

  const currentParticipants = participants.filter(
    (participant) => participant.status !== "declined"
  ).length;

  return NextResponse.json({
    id: event.id,
    title: event.title,
    organizerId: event.organizerId,
    organizerName: event.organizer.username,
    organizerAvatar: event.organizer.avatarUrl ?? fallbackAvatar,
    date: event.eventDate ? event.eventDate.toISOString() : new Date().toISOString(),
    location: event.location ?? "",
    hashtags: event.hashtags.map((tag) => tag.tag),
    imageUrl: event.imageUrl ?? undefined,
    description: event.description ?? "",
    price: event.priceCents ?? undefined,
    maxParticipants: event.maxParticipants ?? participants.length,
    currentParticipants,
    participants,
    dateOptions,
  });
}
