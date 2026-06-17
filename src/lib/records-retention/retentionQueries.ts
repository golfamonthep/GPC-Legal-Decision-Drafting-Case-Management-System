import prisma from "@/lib/db";

export interface RetentionOverview {
  totalCases: number;
  archiveReady: number;
  retainedActive: number;
  requiresReview: number;
}

export interface CaseRetentionSummary {
  id: string;
  blackNumber: string;
  redNumber: string | null;
  subject: string;
  type: string;
  currentStatus: string;
  decisionResult: string | null;
  receivedDate: Date | null;
  lifecycleStatus: string | null;
  archiveStatus: string | null;
}

/**
 * Fetch high-level retention overview statistics safely.
 */
export async function getRetentionOverview(): Promise<RetentionOverview> {
  const [totalCases, archiveReady, retainedActive, requiresReview] = await Promise.all([
    prisma.case.count(),
    prisma.caseArchiveRecord.count({ where: { lifecycleStatus: 'READY_TO_ARCHIVE' } }),
    prisma.case.count({ where: { currentStatus: { notIn: ['ปิดคดี', 'ส่งศาล'] } } }),
    prisma.caseArchiveRecord.count({ where: { lifecycleStatus: 'RETENTION_REVIEW_REQUIRED' } }),
  ]);

  return {
    totalCases,
    archiveReady,
    retainedActive,
    requiresReview,
  };
}

/**
 * Fetch a list of cases for the retention queue.
 */
export async function getRetentionQueue(): Promise<CaseRetentionSummary[]> {
  const cases = await prisma.case.findMany({
    take: 50, // Limit for UI safety
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      blackNumber: true,
      redNumber: true,
      subject: true,
      type: true,
      currentStatus: true,
      decisionResult: true,
      receivedDate: true,
      archiveRecords: {
        select: {
          lifecycleStatus: true,
          archiveStatus: true,
        },
        take: 1, // Usually 1-to-1 but modelled as array/relation in some DBs
      }
    }
  });

  return cases.map(c => ({
    id: c.id,
    blackNumber: c.blackNumber,
    redNumber: c.redNumber,
    subject: c.subject,
    type: c.type,
    currentStatus: c.currentStatus,
    decisionResult: c.decisionResult,
    receivedDate: c.receivedDate,
    lifecycleStatus: c.archiveRecords?.[0]?.lifecycleStatus || 'ACTIVE',
    archiveStatus: c.archiveRecords?.[0]?.archiveStatus || 'PENDING',
  }));
}
