import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const period = searchParams.get("period") ?? "all";

  if (!userId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    await prisma.profile.create({
      data: {
        userId,
        displayName: `ユーザー${userId.slice(0, 4)}`,
        gender: "unspecified",
      },
    });
  }

  const now = new Date();
  const periodStart =
    period === "7d"
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : period === "30d"
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        : period === "90d"
          ? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          : null;

  const where = {
    userId,
    ...(periodStart ? { createdAt: { gte: periodStart } } : {}),
  };

  let notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  if (notifications.length === 0) {
    const recentEvent = await prisma.event.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, purpose: true },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId,
          type: "friend_added",
          message: "フレンド候補が見つかりました。プロフィールから確認できます。",
        },
        {
          userId,
          type: "invite_received",
          message: recentEvent
            ? `「${recentEvent.purpose}」への参加を検討してみましょう。`
            : "新しいイベントの招待を受け取れる状態になりました。",
          eventId: recentEvent?.id,
        },
      ],
    });

    notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json(notifications);
}
