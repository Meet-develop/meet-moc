import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const fallbackAvatar =
  "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

export async function GET() {
  const events = await prisma.event.findMany({
    include: { organizer: true, hashtags: true },
    orderBy: { eventDate: "asc" },
  });

  return NextResponse.json(
    events.map((event) => ({
      id: event.id,
      title: event.title,
      organizerId: event.organizerId,
      organizerName: event.organizer.username,
      organizerAvatar: event.organizer.avatarUrl ?? fallbackAvatar,
      date: event.eventDate ? event.eventDate.toISOString() : new Date().toISOString(),
      location: event.location ?? "",
      hashtags: event.hashtags.map((tag) => tag.tag),
      imageUrl: event.imageUrl ?? undefined,
    }))
  );
}
