import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toNotificationView } from "@/lib/notification-content";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const markAsRead =
    searchParams.get("markAsRead") === "1" ||
    searchParams.get("markAsRead") === "true";

  if (!userId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  const existing = await prisma.notification.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  let notification = existing;
  if (markAsRead && !existing.readAt) {
    notification = await prisma.notification.update({
      where: { id: existing.id },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json(toNotificationView(notification));
}
