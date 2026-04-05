ALTER TABLE "profiles"
ADD COLUMN "line_user_id" TEXT;

CREATE UNIQUE INDEX "profiles_line_user_id_key" ON "profiles"("line_user_id");

CREATE TABLE "event_invite_requests" (
  "id" UUID NOT NULL,
  "event_id" UUID NOT NULL,
  "requester_id" UUID NOT NULL,
  "invitee_id" UUID NOT NULL,
  "status" "invite_status" NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_invite_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_invite_requests_unique"
ON "event_invite_requests"("event_id", "requester_id", "invitee_id");

ALTER TABLE "event_invite_requests"
ADD CONSTRAINT "event_invite_requests_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "events"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_invite_requests"
ADD CONSTRAINT "event_invite_requests_requester_id_fkey"
FOREIGN KEY ("requester_id") REFERENCES "profiles"("user_id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_invite_requests"
ADD CONSTRAINT "event_invite_requests_invitee_id_fkey"
FOREIGN KEY ("invitee_id") REFERENCES "profiles"("user_id")
ON DELETE CASCADE ON UPDATE CASCADE;
