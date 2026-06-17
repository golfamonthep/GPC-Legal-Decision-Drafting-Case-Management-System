import prisma from "@/lib/db";
import { assertArchiveExecutionEnvironment } from "./archiveEnvironmentGate";
import { evaluateArchiveEligibility } from "./archivePreview";

const BATCH_LIMIT = 25;

export interface ArchiveExecutionInput {
  caseIds: string[];
  reason: string;
  policyReference?: string;
  confirmationPhrase: string;
}

export interface ArchiveExecutionResult {
  ok: boolean;
  executed: boolean;
  archiveBatchId?: string;
  archivedCount: number;
  blockedCount: number;
  blockedReasons: Record<string, string>;
  warnings: string[];
}

export async function executeArchiveCases(
  input: ArchiveExecutionInput,
  actor: { id: string; name?: string | null }
): Promise<ArchiveExecutionResult> {
  // 1. Enforce environment safety (Staging only)
  assertArchiveExecutionEnvironment();

  const { caseIds, reason, policyReference, confirmationPhrase } = input;
  const warnings: string[] = [];

  if (!caseIds || caseIds.length === 0) {
    throw new Error("No cases selected for archive execution.");
  }

  if (caseIds.length > BATCH_LIMIT) {
    throw new Error(`Batch limit exceeded. Maximum ${BATCH_LIMIT} cases allowed.`);
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error("A reason is required for archive execution.");
  }

  // Expect project specific confirmation phrase
  const expectedPhrases = ["ARCHIVE PILOT CASES", "ยืนยันจัดเก็บสำนวน"];
  if (!expectedPhrases.includes(confirmationPhrase)) {
    throw new Error("Invalid confirmation phrase.");
  }

  // 2. Re-run eligibility check
  const cases = await prisma.case.findMany({
    where: { id: { in: caseIds } },
    include: {
      archiveRecords: true,
      agendaItems: {
        include: {
          meeting: true
        }
      }
    }
  });

  const caseMap = new Map(cases.map(c => [c.id, c]));
  const eligibleCaseIds: string[] = [];
  const blockedReasons: Record<string, string> = {};

  for (const caseId of caseIds) {
    const caseRecord = caseMap.get(caseId);
    if (!caseRecord) {
      blockedReasons[caseId] = "CASE_NOT_FOUND";
      continue;
    }

    const reasons = evaluateArchiveEligibility(caseRecord);
    if (reasons.length === 0) {
      eligibleCaseIds.push(caseId);
    } else {
      blockedReasons[caseId] = reasons.join(", ");
    }
  }

  if (eligibleCaseIds.length === 0) {
    return {
      ok: false,
      executed: false,
      archivedCount: 0,
      blockedCount: caseIds.length,
      blockedReasons,
      warnings: ["No cases were eligible for archiving."],
    };
  }

  if (eligibleCaseIds.length < caseIds.length) {
    warnings.push(`${caseIds.length - eligibleCaseIds.length} cases were skipped due to eligibility blocks.`);
  }

  // 3. Execute archive in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the batch record
    const batch = await tx.archiveBatch.create({
      data: {
        status: "EXECUTED",
        reason: reason,
        policyReference: policyReference,
        createdByUserId: actor.id,
        dryRun: false,
        executedAt: new Date(),
        totalCount: caseIds.length,
        eligibleCount: eligibleCaseIds.length,
        blockedCount: caseIds.length - eligibleCaseIds.length,
        notes: "Environment: STAGING_EXECUTION",
      }
    });

    for (const caseId of eligibleCaseIds) {
      const caseRecord = caseMap.get(caseId);
      const previousStatus = caseRecord?.currentStatus || "UNKNOWN";

      // Update case currentStatus to ARCHIVED
      await tx.case.update({
        where: { id: caseId },
        data: { currentStatus: "ARCHIVED" }
      });

      // Find or create case archive record
      const existingArchiveRecords = await tx.caseArchiveRecord.findMany({
        where: { caseId }
      });

      if (existingArchiveRecords.length > 0) {
        await tx.caseArchiveRecord.update({
          where: { id: existingArchiveRecords[0].id },
          data: {
            archiveStatus: "COMPLETED",
            lifecycleStatus: "ARCHIVED",
            archiveReason: reason,
            archivedAt: new Date(),
            archivedByUserId: actor.id,
            previousStatusBeforeArchive: previousStatus,
            archiveBatchId: batch.id,
          }
        });
      } else {
        await tx.caseArchiveRecord.create({
          data: {
            caseId,
            archiveStatus: "COMPLETED",
            lifecycleStatus: "ARCHIVED",
            archiveReason: reason,
            archivedAt: new Date(),
            archivedByUserId: actor.id,
            previousStatusBeforeArchive: previousStatus,
            archiveBatchId: batch.id,
          }
        });
      }

      // Create batch item
      await tx.archiveBatchItem.create({
        data: {
          archiveBatchId: batch.id,
          caseId,
          previousCaseStatus: previousStatus,
          status: "EXECUTED",
          executedAt: new Date(),
        }
      });

      // Write general audit log
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: "ARCHIVE_CASE",
          entityType: "CASE",
          entityId: caseId,
          beforeValue: previousStatus,
          afterValue: "ARCHIVED",
        }
      });
    }

    return batch;
  });

  return {
    ok: true,
    executed: true,
    archiveBatchId: result.id,
    archivedCount: eligibleCaseIds.length,
    blockedCount: Object.keys(blockedReasons).length,
    blockedReasons,
    warnings,
  };
}
