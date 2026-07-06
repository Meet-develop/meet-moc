import dotenv from "dotenv";
dotenv.config();

import fs from "node:fs";
import path from "node:path";

if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const match = envContent.match(/#\s*DATABASE_URL="([^"]+)"/);
      if (match && match[1]) {
        process.env.DATABASE_URL = match[1];
      }
    }
  } catch (e) {
    console.error("Failed to parse commented DATABASE_URL from .env:", e);
  }
}

// Fallback to localhost if still not set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/meet_moc";
}
process.env.ALLOW_NON_LOCAL_DB_IN_DEV = "true";

import assert from "node:assert/strict";
import { prisma } from "../lib/prisma";
import { createAppNotification } from "../lib/notification-delivery";
import { GET } from "../app/api/jobs/reminders/route";

async function test() {
  console.log("Starting reminders tests...");

  // 1. テストデータのセットアップ
  const ownerId = "00000000-0000-0000-0000-000000000001";
  const guestId = "00000000-0000-0000-0000-000000000002";

  // プロファイルの作成
  await prisma.profile.upsert({
    where: { userId: ownerId },
    update: {},
    create: {
      userId: ownerId,
      displayName: "テストオーナー",
    },
  });

  await prisma.profile.upsert({
    where: { userId: guestId },
    update: {},
    create: {
      userId: guestId,
      displayName: "テストゲスト",
    },
  });

  const now = new Date();
  
  // A. 1.5時間後のイベント (当日リマインダー・1時間前リマインダー両方の対象)
  const startTimeA = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);
  const eventA = await prisma.event.create({
    data: {
      ownerId,
      purpose: "テストイベントA",
      capacity: 5,
      scheduleMode: "fixed",
      status: "confirmed",
      fixedStartTime: startTimeA,
      fixedEndTime: new Date(startTimeA.getTime() + 2 * 60 * 60 * 1000),
      participants: {
        createMany: {
          data: [
            { userId: ownerId, status: "approved", role: "owner" },
            { userId: guestId, status: "approved", role: "guest" },
          ],
        },
      },
    },
  });

  // B. 当日の5時間後のイベント (当日リマインダー対象、1時間前リマインダー対象外)
  const startTimeB = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const eventB = await prisma.event.create({
    data: {
      ownerId,
      purpose: "テストイベントB",
      capacity: 5,
      scheduleMode: "fixed",
      status: "confirmed",
      fixedStartTime: startTimeB,
      fixedEndTime: new Date(startTimeB.getTime() + 2 * 60 * 60 * 1000),
      participants: {
        createMany: {
          data: [
            { userId: ownerId, status: "approved", role: "owner" },
          ],
        },
      },
    },
  });

  try {
    // 2. createAppNotification (enrichPayload) のテスト
    // invite_received のテスト
    const inviteNotif = await createAppNotification({
      userId: guestId,
      type: "invite_received",
      message: "元のメッセージ",
      eventId: eventA.id,
    });

    const inviteDb = await prisma.notification.findUnique({ where: { id: inviteNotif.id } });
    assert.ok(inviteDb);
    assert.equal(inviteDb.title, "テストイベントA のお知らせ");
    assert.equal(inviteDb.body, "テストオーナーさんから「テストイベントA」への招待が届きました。");
    console.log("[PASS] invite_received notification enrichment");

    // event_confirmed (リマインダー) のテスト
    const reminderNotif = await createAppNotification({
      userId: guestId,
      type: "event_confirmed",
      title: "当日リマインダー",
      message: "元のメッセージ",
      eventId: eventA.id,
    });

    const reminderDb = await prisma.notification.findUnique({ where: { id: reminderNotif.id } });
    assert.ok(reminderDb);
    assert.equal(reminderDb.title, "テストイベントA のリマインダー");
    assert.match(reminderDb.body!, /テストオーナーさんのイベント「テストイベントA」は本日.*に開催されます。/);
    console.log("[PASS] event_confirmed (reminder) notification enrichment");

    // 3. APIルートハンドラー (GET) のテスト
    // 既存の通知をクリア
    await prisma.notification.deleteMany({
      where: { userId: { in: [ownerId, guestId] } },
    });

    // 偽の Request を渡して type=today を呼び出す
    const reqToday = new Request("http://localhost/api/jobs/reminders?type=today");
    const resToday = await GET(reqToday);
    assert.equal(resToday.status, 200);
    const resTodayJson = await resToday.json();
    assert.ok(resTodayJson.success);

    // 偽の Request を渡して type=hourly を呼び出す
    const reqHourly = new Request("http://localhost/api/jobs/reminders?type=hourly");
    const resHourly = await GET(reqHourly);
    assert.equal(resHourly.status, 200);
    const resHourlyJson = await resHourly.json();
    assert.ok(resHourlyJson.success);

    // 送信された通知を確認
    const guestNotifications = await prisma.notification.findMany({
      where: { userId: guestId, eventId: eventA.id },
      orderBy: { createdAt: "asc" },
    });

    // type=today で1件、type=hourly で1件作成されているはず
    assert.equal(guestNotifications.length, 2);
    
    // 一方は当日リマインダー (本日...)
    assert.equal(guestNotifications[0].title, "テストイベントA のリマインダー");
    assert.match(guestNotifications[0].body!, /本日/);
    
    // もう一方は1時間前リマインダー (まもなく...)
    assert.equal(guestNotifications[1].title, "テストイベントA のリマインダー");
    assert.match(guestNotifications[1].body!, /まもなく（1時間後）/);
    
    console.log("[PASS] cron reminders GET handler logic");

  } finally {
    // 4. クリーンアップ
    await prisma.notification.deleteMany({
      where: { userId: { in: [ownerId, guestId] } },
    });
    await prisma.eventParticipant.deleteMany({
      where: { eventId: { in: [eventA.id, eventB.id] } },
    });
    await prisma.event.deleteMany({
      where: { id: { in: [eventA.id, eventB.id] } },
    });
    await prisma.profile.deleteMany({
      where: { userId: { in: [ownerId, guestId] } },
    });
    console.log("Cleanup completed.");
  }
}

test()
  .then(() => console.log("All reminders tests passed!"))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
