-- AlterTable
ALTER TABLE "ChatConversation" ADD COLUMN     "visitorId" TEXT;

-- CreateIndex
CREATE INDEX "ChatConversation_userId_visitorId_idx" ON "ChatConversation"("userId", "visitorId");
