ALTER TABLE "notifications"
  ADD COLUMN "title" TEXT,
  ADD COLUMN "body" TEXT;

UPDATE "notifications"
SET "body" = "message"
WHERE "body" IS NULL;

UPDATE "notifications"
SET "title" = CASE "type"::text
  WHEN 'invite_received' THEN 'イベント招待'
  WHEN 'event_confirmed' THEN '開催情報のお知らせ'
  WHEN 'join_requested' THEN '参加申請のお知らせ'
  WHEN 'join_approved' THEN '参加承認のお知らせ'
  WHEN 'friend_added' THEN 'プロフィール登録のお願い'
  ELSE 'お知らせ'
END
WHERE "title" IS NULL;
