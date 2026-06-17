import prisma from "@/lib/db";

const BATCH_LIMIT = 25;

export type BlockedReason =
  | "CASE_NOT_FOUND"
  | "CASE_NOT_CLOSED"
  | "FINALIZATION_PENDING"
  | "DISPATCH_PENDING"
  | "DATA_QUALITY_ISSUES_PENDING"
  | "ACTIVE_MEETING_LINKED"
  | "LEGAL_HOLD_UNKNOWN"
  | "LEGAL_HOLD_ACTIVE"
  | "REQUIRED_DOCUMENTS_UNKNOWN"
  | "SCHEMA_SUPPORT_MISSING"
  | "PERMISSION_REQUIRED"
  | "BATCH_LIMIT_EXCEEDED"
  | "ALREADY_ARCHIVED";

export interface ArchiveImpact {
  wouldMarkArchived: boolean;
  wouldPreserveDocuments: boolean;
  wouldPreserveAuditTrail: boolean;
  wouldAffectSearch: boolean;
  wouldAffectReports: boolean;
}

export interface CasePreviewResult {
  caseId: string;
  caseDisplayId: string;
  eligible: boolean;
  blockedReasons: BlockedReason[];
  impact: ArchiveImpact;
}

export interface ArchivePreviewResponse {
  ok: boolean;
  dryRun: true;
  eligibleCount: number;
  blockedCount: number;
  items: CasePreviewResult[];
  warnings: string[];
}

export async function previewArchiveCases(caseIds: string[]): Promise<ArchivePreviewResponse> {
  const warnings: string[] = [];
  
  if (!caseIds || caseIds.length === 0) {
    return {
      ok: false,
      dryRun: true,
      eligibleCount: 0,
      blockedCount: 0,
      items: [],
      warnings: ["No cases selected for preview."]
    };
  }

  if (caseIds.length > BATCH_LIMIT) {
    warnings.push(`Batch limit exceeded. Previewing only the first ${BATCH_LIMIT} cases.`);
    caseIds = caseIds.slice(0, BATCH_LIMIT);
  }

  const items: CasePreviewResult[] = [];
  let eligibleCount = 0;
  let blockedCount = 0;

  // Fetch cases
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

  for (const caseId of caseIds) {
    const caseRecord = caseMap.get(caseId);
    
    if (!caseRecord) {
      items.push({
        caseId,
        caseDisplayId: "Unknown",
        eligible: false,
        blockedReasons: ["CASE_NOT_FOUND"],
        impact: summarizeArchiveImpact(null)
      });
      blockedCount++;
      continue;
    }

    const blockedReasons = evaluateArchiveEligibility(caseRecord);
    const eligible = blockedReasons.length === 0;

    if (eligible) {
      eligibleCount++;
    } else {
      blockedCount++;
    }

    items.push({
      caseId: caseRecord.id,
      caseDisplayId: caseRecord.blackNumber || caseRecord.id,
      eligible,
      blockedReasons,
      impact: summarizeArchiveImpact(caseRecord)
    });
  }

  return {
    ok: true,
    dryRun: true,
    eligibleCount,
    blockedCount,
    items,
    warnings
  };
}

export function evaluateArchiveEligibility(caseRecord: any): BlockedReason[] {
  const reasons: BlockedReason[] = [];

  // Check if closed
  const isClosed = caseRecord.currentStatus === 'ปิดคดี' || caseRecord.currentStatus === 'CLOSED';
  if (!isClosed) {
    reasons.push("CASE_NOT_CLOSED");
  }

  // Check meetings
  const hasActiveMeetings = caseRecord.agendaItems?.some((m: any) => 
    m.meeting?.status !== 'COMPLETED' && m.meeting?.status !== 'CANCELLED'
  );
  if (hasActiveMeetings) {
    reasons.push("ACTIVE_MEETING_LINKED");
  }

  // Check archive records and legal hold
  if (caseRecord.archiveRecords && caseRecord.archiveRecords.length > 0) {
    const archiveRecord = caseRecord.archiveRecords[0];
    
    if (archiveRecord.legalHold === true) {
      reasons.push("LEGAL_HOLD_ACTIVE");
    }
    if (archiveRecord.archiveStatus === "COMPLETED" || archiveRecord.archiveStatus === "ARCHIVED") {
      reasons.push("ALREADY_ARCHIVED");
    }
  } else {
    // If we can't confirm legal hold status, be conservative
    reasons.push("LEGAL_HOLD_UNKNOWN");
  }

  // Missing schema support for detailed validation
  // We add this to indicate that we can't fully validate data quality or required docs with the current schema
  reasons.push("SCHEMA_SUPPORT_MISSING");

  return reasons;
}

export function summarizeArchiveImpact(caseRecord: any): ArchiveImpact {
  // Archive action is not delete. Documents and audit trails are preserved.
  return {
    wouldMarkArchived: true,
    wouldPreserveDocuments: true,
    wouldPreserveAuditTrail: true,
    wouldAffectSearch: true, // Usually excluded from default active searches
    wouldAffectReports: false // Historical reports usually include archived data
  };
}
