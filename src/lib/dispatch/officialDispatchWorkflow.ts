import prisma from '@/lib/db';
import { OfficialDispatchStatus, CourtFollowupStatus } from './officialDispatchStatus';
import { calculateFilingDeadline } from './courtDeadline';
import { auditLog } from '@/lib/audit';

export interface DispatchData {
  dispatchStatus: OfficialDispatchStatus;
  courtFollowupStatus: CourtFollowupStatus;
  noticeDocumentId?: string;
  signedDecisionDocumentId?: string;
  
  dispatchMethod?: string;
  dispatchNo?: string;
  dispatchDate?: string;
  recipientName?: string;
  recipientAddress?: string;
  recipientAgency?: string;
  trackingNo?: string;
  
  acknowledgementDate?: string;
  acknowledgementMethod?: string;
  returnedDate?: string;
  returnedReason?: string;
  reDispatchDate?: string;
  dispatchNote?: string;

  filingPeriodDays?: number;
  
  courtCaseFiled?: boolean;
  courtName?: string;
  courtCaseNumber?: string;
  courtFiledDate?: string;
  courtPetitionerName?: string;
  courtRespondentName?: string;
  courtStatus?: string;
  courtJudgmentDate?: string;
  courtJudgmentSummary?: string;
  courtJudgmentCategory?: string;
  courtDocumentId?: string;
  courtFollowupNote?: string;

  courtEvents?: CourtEvent[];
}

export interface CourtEvent {
  id: string;
  eventDate: string;
  eventType: string;
  title: string;
  description?: string;
  documentId?: string;
  nextAction?: string;
  nextDueDate?: string;
  createdByUserId: string;
  createdAt: string;
}

export function parseDispatchData(dispatchDataStr: string | null): DispatchData | null {
  if (!dispatchDataStr) return null;
  try {
    return JSON.parse(dispatchDataStr) as DispatchData;
  } catch {
    return null;
  }
}

function stringifyDispatchData(data: DispatchData): string {
  return JSON.stringify(data);
}

export async function getCaseDispatchData(caseId: string) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId }
  });
  if (!caseRecord) throw new Error('Case not found');
  
  const data = parseDispatchData(caseRecord.dispatchData);
  return { caseRecord, dispatchData: data };
}

export async function initializeDispatchWorkflow(caseId: string, actorId: string, actorName: string) {
  const { caseRecord, dispatchData } = await getCaseDispatchData(caseId);
  
  if (dispatchData) {
    throw new Error('Dispatch workflow already initialized for this case');
  }

  const newData: DispatchData = {
    dispatchStatus: OfficialDispatchStatus.NOT_STARTED,
    courtFollowupStatus: CourtFollowupStatus.NOT_APPLICABLE,
    filingPeriodDays: 90,
  };

  await prisma.case.update({
    where: { id: caseId },
    data: {
      dispatchData: stringifyDispatchData(newData),
    }
  });

  await prisma.caseEvent.create({
    data: {
      caseId,
      action: 'OFFICIAL_DISPATCH_WORKFLOW_CREATED',
      actorName,
    }
  });

  await auditLog({
    userId: actorId,
    action: 'OFFICIAL_DISPATCH_WORKFLOW_CREATED',
    entityType: 'Case',
    entityId: caseId,
    afterValue: JSON.stringify(newData),
  });
}

export async function updateDispatchRecord(caseId: string, updates: Partial<DispatchData>, newStatus: OfficialDispatchStatus, actorId: string, actorName: string) {
  const { caseRecord, dispatchData } = await getCaseDispatchData(caseId);
  if (!dispatchData) throw new Error('Dispatch workflow not initialized');

  const newData = { ...dispatchData, ...updates, dispatchStatus: newStatus };

  await prisma.case.update({
    where: { id: caseId },
    data: { dispatchData: stringifyDispatchData(newData) }
  });

  await prisma.caseEvent.create({
    data: { caseId, action: `DISPATCH_RECORD_UPDATED: ${newStatus}`, actorName }
  });

  await auditLog({
    userId: actorId,
    action: 'DISPATCH_RECORD_UPDATED',
    entityType: 'Case',
    entityId: caseId,
    beforeValue: JSON.stringify(dispatchData),
    afterValue: JSON.stringify(newData),
  });
}

export async function recordAcknowledgement(caseId: string, acknowledgementDate: string, acknowledgementMethod: string, note: string | undefined, overrideReason: string | undefined, actorId: string, actorName: string) {
  const { caseRecord, dispatchData } = await getCaseDispatchData(caseId);
  if (!dispatchData) throw new Error('Dispatch workflow not initialized');

  if (dispatchData.dispatchDate) {
    const dispatchD = new Date(dispatchData.dispatchDate);
    const ackD = new Date(acknowledgementDate);
    if (ackD < dispatchD && !overrideReason) {
      throw new Error('วันที่รับทราบต้องไม่ก่อนวันที่ส่งแจ้งผล เว้นแต่ระบุเหตุผล');
    }
  }

  const newData = { 
    ...dispatchData, 
    acknowledgementDate,
    acknowledgementMethod,
    dispatchNote: note ? `${dispatchData.dispatchNote || ''}\n${note}` : dispatchData.dispatchNote,
    dispatchStatus: OfficialDispatchStatus.ACKNOWLEDGED,
    courtFollowupStatus: CourtFollowupStatus.WAITING_FOR_FILING_PERIOD, // Automatically init court follow up
  };

  await prisma.case.update({
    where: { id: caseId },
    data: { dispatchData: stringifyDispatchData(newData) }
  });

  await prisma.caseEvent.create({
    data: { caseId, action: 'ACKNOWLEDGEMENT_RECORDED', actorName }
  });

  await auditLog({
    userId: actorId,
    action: 'ACKNOWLEDGEMENT_RECORDED',
    entityType: 'Case',
    entityId: caseId,
    beforeValue: JSON.stringify(dispatchData),
    afterValue: JSON.stringify(newData),
  });
}

export async function updateCourtFollowupRecord(caseId: string, updates: Partial<DispatchData>, newStatus: CourtFollowupStatus, actorId: string, actorName: string) {
  const { caseRecord, dispatchData } = await getCaseDispatchData(caseId);
  if (!dispatchData) throw new Error('Dispatch workflow not initialized');

  const newData = { ...dispatchData, ...updates, courtFollowupStatus: newStatus };

  await prisma.case.update({
    where: { id: caseId },
    data: { dispatchData: stringifyDispatchData(newData) }
  });

  await prisma.caseEvent.create({
    data: { caseId, action: `COURT_FOLLOWUP_UPDATED: ${newStatus}`, actorName }
  });

  await auditLog({
    userId: actorId,
    action: 'COURT_FOLLOWUP_UPDATED',
    entityType: 'Case',
    entityId: caseId,
    beforeValue: JSON.stringify(dispatchData),
    afterValue: JSON.stringify(newData),
  });
}

export async function addCourtEvent(caseId: string, event: Omit<CourtEvent, 'id' | 'createdAt' | 'createdByUserId'>, actorId: string, actorName: string) {
  const { caseRecord, dispatchData } = await getCaseDispatchData(caseId);
  if (!dispatchData) throw new Error('Dispatch workflow not initialized');

  const newEvent: CourtEvent = {
    ...event,
    id: crypto.randomUUID(),
    createdByUserId: actorId,
    createdAt: new Date().toISOString()
  };

  const events = dispatchData.courtEvents || [];
  events.push(newEvent);

  const newData = { ...dispatchData, courtEvents: events };

  await prisma.case.update({
    where: { id: caseId },
    data: { dispatchData: stringifyDispatchData(newData) }
  });

  await prisma.caseEvent.create({
    data: { caseId, action: `COURT_EVENT_ADDED: ${event.eventType}`, actorName }
  });

  await auditLog({
    userId: actorId,
    action: 'COURT_EVENT_ADDED',
    entityType: 'Case',
    entityId: caseId,
    beforeValue: JSON.stringify(dispatchData),
    afterValue: JSON.stringify(newData),
  });
}
