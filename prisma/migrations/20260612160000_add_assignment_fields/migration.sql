-- AlterTable
ALTER TABLE "Case" ADD COLUMN "committeeOwnerName" TEXT;
ALTER TABLE "Case" ADD COLUMN "assignedAt" TIMESTAMP(3);
ALTER TABLE "Case" ADD COLUMN "assignmentUpdatedAt" TIMESTAMP(3);
