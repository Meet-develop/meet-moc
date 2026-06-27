import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAppNotifications } from "@/lib/notification-delivery";
import { formatDateTimeInJst } from "@/lib/datetime";

export async function GET(request: Request) {
  // Authorization validation
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "today" | "hourly"

  if (type !== "today" && type !== "hourly") {
    return NextResponse.json(
      { message: "Invalid type. Must be 'today' or 'hourly'" },
      { status: 400 }
    );
  }

  const now = new Date();

  if (type === "today") {
    // Today (9:00 JST) Reminder
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const jstTodayStart = new Date(Date.UTC(
      jstNow.getUTCFullYear(),
      jstNow.getUTCMonth(),
      jstNow.getUTCDate(),
      0 - 9, // JST 00:00 -> UTC 15:00 day before
      0, 0, 0
    ));
    const jstTodayEnd = new Date(Date.UTC(
      jstNow.getUTCFullYear(),
      jstNow.getUTCMonth(),
      jstNow.getUTCDate(),
      23 - 9, // JST 23:59:59 -> UTC 14:59:59
      59, 59, 999
    ));

    const events = await prisma.event.findMany({
      where: {
        status: "confirmed",
        fixedStartTime: {
          gte: jstTodayStart,
          lte: jstTodayEnd,
        },
      },
      include: {
        owner: { select: { displayName: true } },
        participants: {
          where: { status: "approved" },
          select: { userId: true },
        },
      },
    });

    let notificationsCreated = 0;

    for (const event of events) {
      const startTimeStr = event.fixedStartTime
        ? formatDateTimeInJst(event.fixedStartTime, { hour: "2-digit", minute: "2-digit" })
        : "";
      const ownerName = event.owner.displayName;
      const title = "本日のイベントリマインダー";
      const body = `${ownerName}さんが作成したイベント「${event.purpose}」は本日 ${startTimeStr} から開催されます。`;

      const approvedParticipantIds = event.participants.map((p) => p.userId);
      if (approvedParticipantIds.length === 0) continue;

      const existingNotifications = await prisma.notification.findMany({
        where: {
          eventId: event.id,
          title,
          createdAt: {
            gte: jstTodayStart,
            lte: jstTodayEnd,
          },
        },
        select: { userId: true },
      });

      const sentUserIds = new Set(existingNotifications.map((n) => n.userId));
      const targetUserIds = approvedParticipantIds.filter((userId) => !sentUserIds.has(userId));

      if (targetUserIds.length > 0) {
        await createAppNotifications(
          targetUserIds.map((userId) => ({
            userId,
            type: "event_confirmed",
            title,
            body,
            message: body,
            eventId: event.id,
          }))
        );
        notificationsCreated += targetUserIds.length;
      }
    }

    return NextResponse.json({ success: true, notificationsCreated });
  } else {
    // 1 Hour Before Reminder
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const events = await prisma.event.findMany({
      where: {
        status: "confirmed",
        fixedStartTime: {
          gte: oneHourLater,
          lt: twoHoursLater,
        },
      },
      include: {
        owner: { select: { displayName: true } },
        participants: {
          where: { status: "approved" },
          select: { userId: true },
        },
      },
    });

    let notificationsCreated = 0;

    for (const event of events) {
      const ownerName = event.owner.displayName;
      const title = "イベント開始1時間前リマインダー";
      const body = `${ownerName}さんが作成したイベント「${event.purpose}」が間もなく（1時間後に）開始されます。`;

      const approvedParticipantIds = event.participants.map((p) => p.userId);
      if (approvedParticipantIds.length === 0) continue;

      const existingNotifications = await prisma.notification.findMany({
        where: {
          eventId: event.id,
          title,
        },
        select: { userId: true },
      });

      const sentUserIds = new Set(existingNotifications.map((n) => n.userId));
      const targetUserIds = approvedParticipantIds.filter((userId) => !sentUserIds.has(userId));

      if (targetUserIds.length > 0) {
        await createAppNotifications(
          targetUserIds.map((userId) => ({
            userId,
            type: "event_confirmed",
            title,
            body,
            message: body,
            eventId: event.id,
          }))
        );
        notificationsCreated += targetUserIds.length;
      }
    }

    return NextResponse.json({ success: true, notificationsCreated });
  }
}
