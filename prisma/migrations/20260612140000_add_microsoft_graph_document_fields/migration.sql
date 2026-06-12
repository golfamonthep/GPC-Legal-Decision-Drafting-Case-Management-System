-- AlterTable
ALTER TABLE "CaseDocument" ADD COLUMN "storageProvider" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN "driveId" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN "driveItemId" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN "webUrl" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN "fileName" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "CaseDocument" ADD COLUMN "documentCategory" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN "sourceStatus" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN "uploadedByUserId" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "CaseDocument" ADD COLUMN "syncStatus" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN "syncError" TEXT;
