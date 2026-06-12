import prisma from '@/lib/db';
import { PostMeetingFollowupStatus } from './postMeetingFollowupStatus';

export interface FinalizationData {
  status: PostMeetingFollowupStatus;
  meetingId?: string;
  meetingAgendaItemId?: string;
  boardResultSummary?: string;
  revisionRequired: boolean;
  revisionInstruction?: string;
  revisionCompletedAt?: string;
  revisionCompletedByUserId?: string;
  finalReviewStatus?: string;
  finalReviewedAt?: string;
  finalReviewedByUserId?: string;
  finalReadinessStatus?: string;
  finalReadinessCheckedAt?: string;
  finalReadinessCheckedByUserId?: string;
  redCaseNumberRecordedAt?: string;
  redCaseNumberRecordedByUserId?: string;
  signedDecisionDocumentId?: string;
  signedAt?: string;
  signedByName?: string;
  finalizedAt?: string;
  finalizedByUserId?: string;
  closedAt?: string;
  closedByUserId?: string;
  closureNote?: string;
}

export function parseFinalizationData(proceedingNote: string | null): FinalizationData | null {
  if (!proceedingNote) return null;
  try {
    const data = JSON.parse(proceedingNote);
    if (data && data._isFinalizationData) {
      return data as FinalizationData;
    }
    return null;
  } catch {
    return null;
  }
}

export function stringifyFinalizationData(data: FinalizationData, originalNote: string | null): string {
  // We overwrite the note but could preserve the original text in a specific field if needed
  return JSON.stringify({ ...data, _isFinalizationData: true, _originalNote: originalNote });
}

export async function getCaseFinalization(caseId: string) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      agendaItems: {
        include: { meeting: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  if (!caseRecord) throw new Error('Case not found');
  
  const data = parseFinalizationData(caseRecord.proceedingNote);
  return { caseRecord, finalizationData: data };
}

export async function initializeFinalization(caseId: string, meetingAgendaItemId: string, boardResult: string, instruction: string | null) {
  const { caseRecord } = await getCaseFinalization(caseId);
  const isRevisionRequired = boardResult === 'ให้แก้ไขร่าง';
  
  const newData: FinalizationData = {
    status: isRevisionRequired ? PostMeetingFollowupStatus.REVISION_REQUIRED : PostMeetingFollowupStatus.READY_FOR_RED_NUMBER,
    meetingAgendaItemId,
    boardResultSummary: boardResult,
    revisionRequired: isRevisionRequired,
    revisionInstruction: instruction || undefined,
  };
  
  await prisma.case.update({
    where: { id: caseId },
    data: {
      proceedingNote: stringifyFinalizationData(newData, caseRecord.proceedingNote),
    }
  });

  await prisma.caseEvent.create({
    data: {
      caseId,
      action: 'FINALIZATION_WORKFLOW_CREATED',
      actorName: 'System',
    }
  });
}

export async function updateFinalizationStatus(caseId: string, status: PostMeetingFollowupStatus, updates: Partial<FinalizationData>, actorName: string, actorId: string) {
  const { caseRecord, finalizationData } = await getCaseFinalization(caseId);
  if (!finalizationData) throw new Error('Finalization not initialized');
  
  const newData = { ...finalizationData, ...updates, status };
  
  await prisma.case.update({
    where: { id: caseId },
    data: {
      proceedingNote: stringifyFinalizationData(newData, caseRecord.proceedingNote),
    }
  });

  await prisma.caseEvent.create({
    data: {
      caseId,
      action: `FINALIZATION_STATUS_UPDATED: ${status}`,
      actorName,
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'FINALIZATION_STATUS_UPDATED',
      entityType: 'Case',
      entityId: caseId,
      afterValue: JSON.stringify(newData),
    }
  });
}

export async function checkFinalReadiness(caseId: string): Promise<{ ready: boolean; reasons: string[] }> {
  const { caseRecord, finalizationData } = await getCaseFinalization(caseId);
  const reasons: string[] = [];
  
  if (!finalizationData) {
    reasons.push('ไม่มีผลการประชุมหรือมติที่เกี่ยวข้อง');
    return { ready: false, reasons };
  }
  
  if (finalizationData.revisionRequired && !finalizationData.revisionCompletedAt) {
    reasons.push('มีการสั่งแก้ไขร่าง แต่ยังไม่ได้ระบุว่าแก้ไขแล้ว');
  }
  
  // We can add more deterministic checks here
  
  return {
    ready: reasons.length === 0,
    reasons
  };
}
