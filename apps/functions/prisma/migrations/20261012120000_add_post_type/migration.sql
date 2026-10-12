-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('REEL', 'CAROUSEL', 'POST');

-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "postType" "PostType" NOT NULL DEFAULT 'REEL';
