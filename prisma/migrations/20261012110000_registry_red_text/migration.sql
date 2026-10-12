-- Preserve the literal first-sheet completion marker separately from a unique legal number.
ALTER TABLE "Case" ADD COLUMN "registryRedText" TEXT;
