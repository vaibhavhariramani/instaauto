-- CreateTable
CREATE TABLE "AiReplySettings" (
    "id" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "personaPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiReplySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiReplySettings_instagramAccountId_key" ON "AiReplySettings"("instagramAccountId");

-- AddForeignKey
ALTER TABLE "AiReplySettings" ADD CONSTRAINT "AiReplySettings_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
