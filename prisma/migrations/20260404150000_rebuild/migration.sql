CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS "event_date_option_participants" CASCADE;
DROP TABLE IF EXISTS "event_date_options" CASCADE;
DROP TABLE IF EXISTS "event_participants" CASCADE;
DROP TABLE IF EXISTS "event_hashtags" CASCADE;
DROP TABLE IF EXISTS "invitations" CASCADE;
DROP TABLE IF EXISTS "notes" CASCADE;
DROP TABLE IF EXISTS "relationships" CASCADE;
DROP TABLE IF EXISTS "user_categories" CASCADE;
DROP TABLE IF EXISTS "user_allergens" CASCADE;
DROP TABLE IF EXISTS "events" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "allergens" CASCADE;

DROP TYPE IF EXISTS "relationship_status" CASCADE;
DROP TYPE IF EXISTS "invitation_status" CASCADE;
DROP TYPE IF EXISTS "participant_status" CASCADE;

DROP TABLE IF EXISTS "event_place_votes" CASCADE;
DROP TABLE IF EXISTS "event_time_votes" CASCADE;
DROP TABLE IF EXISTS "event_place_candidates" CASCADE;
DROP TABLE IF EXISTS "event_time_candidates" CASCADE;
DROP TABLE IF EXISTS "event_invites" CASCADE;
DROP TABLE IF EXISTS "event_participants" CASCADE;
DROP TABLE IF EXISTS "favorite_friends" CASCADE;
DROP TABLE IF EXISTS "friendships" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "place_cache" CASCADE;
DROP TABLE IF EXISTS "events" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;

DROP TYPE IF EXISTS "gender" CASCADE;
DROP TYPE IF EXISTS "play_frequency" CASCADE;
DROP TYPE IF EXISTS "drink_frequency" CASCADE;
DROP TYPE IF EXISTS "friendship_status" CASCADE;
DROP TYPE IF EXISTS "event_visibility" CASCADE;
DROP TYPE IF EXISTS "event_status" CASCADE;
DROP TYPE IF EXISTS "schedule_mode" CASCADE;
DROP TYPE IF EXISTS "participant_status" CASCADE;
DROP TYPE IF EXISTS "participant_role" CASCADE;
DROP TYPE IF EXISTS "invite_status" CASCADE;
DROP TYPE IF EXISTS "candidate_source" CASCADE;
DROP TYPE IF EXISTS "notification_type" CASCADE;

CREATE TYPE "gender" AS ENUM ('male', 'female', 'other', 'unspecified');
CREATE TYPE "play_frequency" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "drink_frequency" AS ENUM ('never', 'sometimes', 'often');
CREATE TYPE "friendship_status" AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE "event_visibility" AS ENUM ('public', 'limited', 'private');
CREATE TYPE "event_status" AS ENUM ('open', 'confirmed', 'completed', 'cancelled');
CREATE TYPE "schedule_mode" AS ENUM ('fixed', 'candidate');
CREATE TYPE "participant_status" AS ENUM ('requested', 'approved', 'declined', 'cancelled');
CREATE TYPE "participant_role" AS ENUM ('owner', 'guest');
CREATE TYPE "invite_status" AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE "candidate_source" AS ENUM ('system', 'proposal');
CREATE TYPE "notification_type" AS ENUM ('event_confirmed', 'invite_received', 'join_requested', 'join_approved', 'friend_added');

CREATE TABLE "profiles" (
  "user_id" UUID PRIMARY KEY,
  "display_name" TEXT NOT NULL,
  "gender" gender NOT NULL DEFAULT 'unspecified',
  "birth_date" DATE,
  "play_frequency" play_frequency,
  "drink_frequency" drink_frequency,
  "budget_min" INTEGER,
  "budget_max" INTEGER,
  "ng_foods" TEXT[] NOT NULL DEFAULT '{}',
  "favorite_areas" TEXT[] NOT NULL DEFAULT '{}',
  "favorite_places" TEXT[] NOT NULL DEFAULT '{}',
  "availability" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "friendships" (
  "user_id" UUID NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "friend_id" UUID NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "status" friendship_status NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "friend_id")
);

CREATE TABLE "favorite_friends" (
  "user_id" UUID NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "favorite_user_id" UUID NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "favorite_user_id")
);

CREATE TABLE "events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "purpose" TEXT NOT NULL,
  "visibility" event_visibility NOT NULL DEFAULT 'public',
  "capacity" INTEGER NOT NULL,
  "status" event_status NOT NULL DEFAULT 'open',
  "schedule_mode" schedule_mode NOT NULL,
  "fixed_start_time" TIMESTAMPTZ,
  "fixed_end_time" TIMESTAMPTZ,
  "fixed_place_id" TEXT,
  "fixed_place_name" TEXT,
  "fixed_place_address" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "event_participants" (
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "status" participant_status NOT NULL DEFAULT 'requested',
  "role" participant_role NOT NULL DEFAULT 'guest',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("event_id", "user_id")
);

CREATE TABLE "event_invites" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "inviter_id" UUID NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "invitee_id" UUID REFERENCES "profiles"("user_id") ON DELETE SET NULL,
  "token" TEXT NOT NULL UNIQUE,
  "status" invite_status NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "event_time_candidates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "start_time" TIMESTAMPTZ NOT NULL,
  "end_time" TIMESTAMPTZ NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "source" candidate_source NOT NULL DEFAULT 'system',
  "proposed_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "event_place_candidates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "place_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "price_level" INTEGER,
  "score" INTEGER NOT NULL DEFAULT 0,
  "source" candidate_source NOT NULL DEFAULT 'system',
  "proposed_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "event_time_votes" (
  "candidate_id" UUID NOT NULL REFERENCES "event_time_candidates"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "is_available" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("candidate_id", "user_id")
);

CREATE TABLE "event_place_votes" (
  "candidate_id" UUID NOT NULL REFERENCES "event_place_candidates"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "score" INTEGER NOT NULL DEFAULT 3,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("candidate_id", "user_id")
);

CREATE TABLE "place_cache" (
  "query" TEXT PRIMARY KEY,
  "response" JSONB NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "type" notification_type NOT NULL,
  "message" TEXT NOT NULL,
  "event_id" UUID REFERENCES "events"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "read_at" TIMESTAMPTZ
);
