-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "publicReplyMessages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Automation" ADD COLUMN     "ctaButtonLabel" TEXT;

-- Backfill: carry the existing single message into the new array column
UPDATE "Automation"
SET "publicReplyMessages" = ARRAY["publicReplyMessage"]
WHERE "publicReplyMessage" IS NOT NULL AND "publicReplyMessage" <> '';

-- DropColumn
ALTER TABLE "Automation" DROP COLUMN "publicReplyMessage";
