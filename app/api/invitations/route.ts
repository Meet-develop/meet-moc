import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const fallbackAvatar =
  "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

export async function GET() {
  const invitations = await prisma.invitation.findMany({
    include: { event: true, organizer: true },
    orderBy: { invitedAt: "desc" },
  });

  return NextResponse.json(
    invitations.map((invitation) => ({
      id: invitation.id,
      eventId: invitation.eventId,
      eventTitle: invitation.event.title,
      eventImageUrl: invitation.event.imageUrl ?? undefined,
      organizerId: invitation.organizerId,
      organizerName: invitation.organizer.username,
      organizerAvatar: invitation.organizer.avatarUrl ?? fallbackAvatar,
      invitedAt: invitation.invitedAt.toISOString(),
      status: invitation.status,
      message: invitation.message ?? undefined,
    }))
  );
}
