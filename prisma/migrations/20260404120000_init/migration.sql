CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE relationship_status AS ENUM ('hot', 'normal', 'block');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'maybe');
CREATE TYPE participant_status AS ENUM ('confirmed', 'maybe', 'declined');

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" TEXT NOT NULL,
  "avatar_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "notes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "message" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "event_date" DATE,
  "location" TEXT,
  "price_cents" INTEGER,
  "max_participants" INTEGER,
  "image_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "event_hashtags" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "tag" TEXT NOT NULL
);

CREATE TABLE "event_participants" (
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" participant_status NOT NULL DEFAULT 'confirmed',
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("event_id", "user_id")
);

CREATE TABLE "event_date_options" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "option_date" DATE NOT NULL,
  "start_time" TIME NOT NULL,
  "end_time" TIME NOT NULL
);

CREATE TABLE "event_date_option_participants" (
  "option_id" UUID NOT NULL REFERENCES "event_date_options"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  PRIMARY KEY ("option_id", "user_id")
);

CREATE TABLE "invitations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "organizer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "invitee_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" invitation_status NOT NULL DEFAULT 'pending',
  "message" TEXT,
  "invited_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "categories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "emoji" TEXT,
  "description" TEXT,
  "color" TEXT
);

CREATE TABLE "allergens" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "emoji" TEXT
);

CREATE TABLE "user_categories" (
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "category_id" TEXT NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "category_id")
);

CREATE TABLE "user_allergens" (
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "allergen_id" TEXT NOT NULL REFERENCES "allergens"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "allergen_id")
);

CREATE TABLE "relationships" (
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "target_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" relationship_status NOT NULL DEFAULT 'normal',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "target_user_id")
);
