-- RenameColumn: scoped clearly to the opening DM now that the follow-ask and final CTA each
-- get their own distinct button config.
ALTER TABLE "Automation" RENAME COLUMN "ctaButtonLabel" TO "openingButtonLabel";

-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "followButtonLabel" TEXT;
ALTER TABLE "Automation" ADD COLUMN     "sendCtaIfNeverFollows" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Automation" ADD COLUMN     "ctaLinkButtons" JSONB NOT NULL DEFAULT '[]';
