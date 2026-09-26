-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "requireFollowBeforeCta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "followGateMessage" TEXT;

-- CreateTable
CREATE TABLE "FollowGateState" (
    "id" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "participantIgUserId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "asksSent" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowGateState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FollowGateState_instagramAccountId_participantIgUserId_automationId_key" ON "FollowGateState"("instagramAccountId", "participantIgUserId", "automationId");

-- AddForeignKey
ALTER TABLE "FollowGateState" ADD CONSTRAINT "FollowGateState_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
