-- AlterTable
ALTER TABLE "User" ADD COLUMN "microsoftAccountId" TEXT;
ALTER TABLE "User" ADD COLUMN "image" TEXT;
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_microsoftAccountId_key" ON "User"("microsoftAccountId");
