# Microsoft Graph Content Quarantine Migration Review

## Status
**MANUAL MIGRATION PLAN ONLY**

## Overview
Due to the unavailability of a local safe development database (error P1001), the automatic `prisma migrate dev` command could not be used to generate the SQL migration file. Therefore, we document the manual migration plan.

## Additive Schema Changes
We added the following model to `prisma/schema.prisma`:

```prisma
model GraphContentIngestionQuarantineItem {
  id                  String   @id @default(uuid())
  prototypeRunId      String?
  externalItemKeyHash String
  safeDisplayName     String
  extension           String?
  mimeType            String?
  sizeBytes           BigInt?
  classification      String?
  quarantineReason    String
  quarantineStatus    String   @default("QUARANTINED")
  reviewNotes         String?  @db.Text
  reviewedById        String?
  reviewedAt          DateTime?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([prototypeRunId])
  @@index([externalItemKeyHash])
  @@index([quarantineStatus])
}
```

## SQL Translation (PostgreSQL)
When the schema is deployed, the expected generated SQL should be strictly additive:

```sql
CREATE TABLE "GraphContentIngestionQuarantineItem" (
    "id" TEXT NOT NULL,
    "prototypeRunId" TEXT,
    "externalItemKeyHash" TEXT NOT NULL,
    "safeDisplayName" TEXT NOT NULL,
    "extension" TEXT,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "classification" TEXT,
    "quarantineReason" TEXT NOT NULL,
    "quarantineStatus" TEXT NOT NULL DEFAULT 'QUARANTINED',
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphContentIngestionQuarantineItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GraphContentIngestionQuarantineItem_prototypeRunId_idx" ON "GraphContentIngestionQuarantineItem"("prototypeRunId");
CREATE INDEX "GraphContentIngestionQuarantineItem_externalItemKeyHash_idx" ON "GraphContentIngestionQuarantineItem"("externalItemKeyHash");
CREATE INDEX "GraphContentIngestionQuarantineItem_quarantineStatus_idx" ON "GraphContentIngestionQuarantineItem"("quarantineStatus");
```

## Review Criteria
- **Is this strictly additive?** YES.
- **Does it drop tables?** NO.
- **Does it drop columns?** NO.
- **Does it alter existing columns?** NO.
- **Does it delete data?** NO.

This migration is considered safe for deployment to the staging environment.
