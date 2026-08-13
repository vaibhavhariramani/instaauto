-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "participantIgUserId" TEXT NOT NULL,
    "participantUsername" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "lastMessagePreview" TEXT,
    "lastMessageDirection" "MessageDirection",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "content" TEXT NOT NULL,
    "externalMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_instagramAccountId_lastMessageAt_idx" ON "Conversation"("instagramAccountId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_instagramAccountId_participantIgUserId_key" ON "Conversation"("instagramAccountId", "participantIgUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_externalMessageId_key" ON "DirectMessage"("externalMessageId");

-- CreateIndex
CREATE INDEX "DirectMessage_conversationId_createdAt_idx" ON "DirectMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
