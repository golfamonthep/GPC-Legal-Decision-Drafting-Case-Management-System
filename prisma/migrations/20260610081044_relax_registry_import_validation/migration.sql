-- AlterTable
ALTER TABLE "Case" ALTER COLUMN "receivedDate" DROP NOT NULL;
ALTER TABLE "Case" ADD COLUMN "legalOfficerName" TEXT;
ALTER TABLE "Case" ADD COLUMN "proceedingNote" TEXT;
