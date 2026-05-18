-- CreateEnum
CREATE TYPE "time_availability" AS ENUM ('available', 'maybe', 'unavailable');

-- AlterTable: add new column (nullable first for data migration)
ALTER TABLE "event_time_votes" ADD COLUMN "availability" "time_availability";

-- MigrateData: is_available=true -> available, is_available=false -> unavailable
UPDATE "event_time_votes"
SET "availability" = CASE
  WHEN "is_available" = true THEN 'available'::"time_availability"
  ELSE 'unavailable'::"time_availability"
END;

-- AlterTable: set NOT NULL after migration
ALTER TABLE "event_time_votes" ALTER COLUMN "availability" SET NOT NULL;
ALTER TABLE "event_time_votes" ALTER COLUMN "availability" SET DEFAULT 'available'::"time_availability";

-- AlterTable: drop old column
ALTER TABLE "event_time_votes" DROP COLUMN "is_available";
