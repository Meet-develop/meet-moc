import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const validStatuses = new Set(["pending", "accepted", "declined", "maybe"]);
const fallbackAvatar =
  "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    status?: string;
    message?: string;
  };

  if (!body.status || !validStatuses.has(body.status)) {
    return NextResponse.json(
      { message: "Invalid status" },
      { status: 400 }
    );
  }

  const invitation = await prisma.invitation.update({
    where: { id },
    data: {
      status: body.status,
      message: body.message ?? undefined,
    },
    include: { event: true, organizer: true },
  });

  return NextResponse.json({
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
  });
}
