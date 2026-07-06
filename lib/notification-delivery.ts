import { prisma } from "@/lib/prisma";
import { formatDateTimeInJst } from "@/lib/datetime";

type NotificationPayload = {
  userId: string;
  type: "event_confirmed" | "invite_received" | "join_requested" | "join_approved" | "friend_added";
  title?: string | null;
  body?: string | null;
  message: string;
  eventId?: string | null;
};

const getAppOrigin = () =>
  process.env.APP_ORIGIN?.trim() || process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() || "";

const buildLineMessage = (payload: NotificationPayload) => {
  const title = payload.title?.trim() || "お知らせ";
  const body = payload.body?.trim() || payload.message;
  const origin = getAppOrigin();
  const eventLink = payload.eventId && origin ? `${origin}/events/${payload.eventId}` : null;

  return eventLink
    ? `${title}\n${body}\n\n詳細: ${eventLink}`
    : `${title}\n${body}`;
};

const pushLineMessage = async (lineUserId: string, text: string) => {
  const channelAccessToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim();
  if (!channelAccessToken) return;

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [
        {
          type: "text",
          text,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`LINE push failed: ${response.status} ${detail}`);
  }
};

const deliverToLineIfLinked = async (payload: NotificationPayload) => {
  const channelAccessToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim();
  if (!channelAccessToken) return;

  const profile = (await prisma.profile.findUnique({
    where: { userId: payload.userId },
  })) as { lineUserId?: string | null } | null;

  const lineUserId = profile?.lineUserId?.trim();
  if (!lineUserId) return;

  const text = buildLineMessage(payload);
  await pushLineMessage(lineUserId, text);
};

const enrichPayload = async (payload: NotificationPayload): Promise<NotificationPayload> => {
  if (!payload.eventId) return payload;

  try {
    const eventInfo = await prisma.event.findUnique({
      where: { id: payload.eventId },
      select: {
        purpose: true,
        fixedStartTime: true,
        owner: {
          select: {
            displayName: true,
          },
        },
      },
    });

    if (eventInfo) {
      const enriched = { ...payload };
      const ownerName = eventInfo.owner.displayName;
      const eventName = eventInfo.purpose;
      const startTimeStr = eventInfo.fixedStartTime
        ? formatDateTimeInJst(eventInfo.fixedStartTime, { hour: "2-digit", minute: "2-digit" })
        : "";

      if (payload.type === "invite_received") {
        if (payload.title !== "イベントが削除されました") {
          enriched.title = `${eventName} のお知らせ`;
          enriched.body = `${ownerName}さんから「${eventName}」への招待が届きました。`;
          enriched.message = enriched.body;
        }
      } else if (payload.type === "event_confirmed") {
        if (payload.title?.includes("リマインダー")) {
          const isDaily = payload.title.includes("当日") || payload.title.includes("本日");
          const timeText = isDaily ? "本日" : "まもなく（1時間後）";
          const timeDetails = startTimeStr ? ` ${startTimeStr}〜` : "";
          enriched.title = `${eventName} のリマインダー`;
          enriched.body = `${ownerName}さんのイベント「${eventName}」は${timeText}${timeDetails}に開催されます。`;
          enriched.message = enriched.body;
        }
      }

      return enriched;
    }
  } catch (error) {
    console.error("Failed to enrich notification payload", error);
  }

  return payload;
};

export const createAppNotification = async (payload: NotificationPayload) => {
  const enriched = await enrichPayload(payload);
  const created = await prisma.notification.create({
    data: {
      userId: enriched.userId,
      type: enriched.type,
      title: enriched.title,
      body: enriched.body,
      message: enriched.message,
      eventId: enriched.eventId,
    },
  });

  try {
    await deliverToLineIfLinked(enriched);
  } catch (error) {
    console.error("Failed to deliver LINE notification", error);
  }

  return created;
};

export const createAppNotifications = async (payloads: NotificationPayload[]) => {
  if (payloads.length === 0) {
    return;
  }

  const enrichedPayloads = await Promise.all(payloads.map(enrichPayload));

  await prisma.notification.createMany({
    data: enrichedPayloads.map((payload) => ({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      message: payload.message,
      eventId: payload.eventId,
    })),
  });

  await Promise.all(
    enrichedPayloads.map(async (payload) => {
      try {
        await deliverToLineIfLinked(payload);
      } catch (error) {
        console.error("Failed to deliver LINE notification", error);
      }
    })
  );
};
