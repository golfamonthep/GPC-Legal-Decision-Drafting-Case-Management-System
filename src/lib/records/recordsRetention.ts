import prisma from '@/lib/db';


/**
 * Check if a case meets the readiness criteria for archiving.
 * Returns an object with `ready: boolean` and `blockers: string[]`.
 */
export async function checkArchiveReadiness(caseId: string) {
  const caseObj = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      drafts: true,
      documents: true,
      events: true,
    },
  });
  if (!caseObj) {
    return { ready: false, blockers: ['ไม่พบสำนวน'] };
  }

  const blockers: string[] = [];

  // 1. case must be finalized or closed
  const closed = ['FINALIZED', 'ARCHIVED', 'CLOSED', 'closed', 'completed'];
  if (!closed.includes(caseObj.currentStatus?.toUpperCase())) {
    blockers.push('สำนวนยังไม่เสร็จสมบูรณ์');
  }

  // 2. red case number existence or valid closure note
  const hasRed = caseObj.redNumber && caseObj.redNumber.trim() !== '';
  if (!hasRed) {
    blockers.push('ไม่มีเลขแดง');
  }

  // 3. final decision document (type "final_decision") must exist and be signed
  const finalDoc = caseObj.documents.find(d => d.type === 'final_decision');
  if (!finalDoc) {
    blockers.push('ไม่มีเอกสารสรุปการตัดสินใจ');
  } else if (!finalDoc.sourceStatus || finalDoc.sourceStatus !== 'signed') {
    blockers.push('เอกสารสรุปยังไม่ได้เซ็น');
  }

  // 4. dispatch workflow completed (if any)
  const dispatchEvent = caseObj.events.find(e => e.action === 'DISPATCH_COMPLETED');
  if (!dispatchEvent) {
    blockers.push('ขั้นตอนแจ้งผลยังไม่ครบ');
  }

  // 5. acknowledgement recorded
  const ackEvent = caseObj.events.find(e => e.action === 'ACKNOWLEDGEMENT_RECORDED');
  if (!ackEvent) {
    blockers.push('ไม่มีการรับทราบผล');
  }

  // 6. court follow‑up completed or not applicable
  const courtEvent = caseObj.events.find(e => e.action === 'COURT_FOLLOWUP_COMPLETED');
  if (!courtEvent && caseObj.currentStatus !== 'COURT_FOLLOWUP') {
    blockers.push('ขั้นตอนติดตามศาลยังไม่ครบ');
  }

  // 7. legal hold must be false
  const archiveRecord = await prisma.caseArchiveRecord.findFirst({ where: { caseId } });
  if (archiveRecord?.legalHold) {
    blockers.push('สำนวนอยู่ใน legal hold');
  }

  // 8. no open data-quality issues (simplified check on AuditLog by entityId)
  const openIssues = await prisma.auditLog.findMany({
    where: { entityId: caseId, action: 'DATA_QUALITY_ISSUE_OPEN' },
  });
  if (openIssues.length > 0) {
    blockers.push('มีปัญหาคุณภาพข้อมูลที่ยังเปิดอยู่');
  }

  const ready = blockers.length === 0;
  return { ready, blockers };
}

/** Mark case as ready to archive (does not perform the archive). */
export async function markReadyToArchive(caseId: string, userId: string) {
  const { ready, blockers } = await checkArchiveReadiness(caseId);
  if (!ready) {
    throw new Error('สำนวนนี้ยังไม่พร้อมจัดเก็บ');
  }
  await prisma.caseArchiveRecord.upsert({
    where: { caseId },
    update: { lifecycleStatus: 'READY_TO_ARCHIVE' },
    create: {
      caseId,
      lifecycleStatus: 'READY_TO_ARCHIVE',
      archiveStatus: 'PENDING',
    },
  });
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CASE_MARKED_READY_TO_ARCHIVE',
      entityType: 'CaseArchiveRecord',
      entityId: caseId,
      beforeValue: null,
      afterValue: 'READY_TO_ARCHIVE',
    },
  });
  await prisma.caseEvent.create({
    data: {
      caseId,
      action: 'MARK_READY_TO_ARCHIVE',
      actorName: userId,
    },
  });
  return true;
}

/** Archive a case after confirmation. */
export async function archiveCase(caseId: string, userId: string, reason: string, locationUrl?: string) {
  const { ready, blockers } = await checkArchiveReadiness(caseId);
  if (!ready) {
    throw new Error('สำนวนนี้ยังไม่พร้อมจัดเก็บ');
  }
  const record = await prisma.caseArchiveRecord.upsert({
    where: { caseId },
    update: {
      lifecycleStatus: 'ARCHIVED',
      archiveStatus: 'COMPLETED',
      archiveReason: reason,
      digitalArchiveFolderUrl: locationUrl,
      archivedAt: new Date(),
      archivedByUserId: userId,
    },
    create: {
      caseId,
      lifecycleStatus: 'ARCHIVED',
      archiveStatus: 'COMPLETED',
      archiveReason: reason,
      digitalArchiveFolderUrl: locationUrl,
      archivedAt: new Date(),
      archivedByUserId: userId,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CASE_ARCHIVED',
      entityType: 'CaseArchiveRecord',
      entityId: record.id,
      beforeValue: null,
      afterValue: JSON.stringify(record),
    },
  });
  await prisma.caseEvent.create({
    data: {
      caseId,
      action: 'ARCHIVE',
      actorName: userId,
    },
  });
  return record;
}

/** Unarchive a case with reason. */
export async function unarchiveCase(caseId: string, userId: string, reason: string) {
  const record = await prisma.caseArchiveRecord.findUnique({ where: { caseId } });
  if (!record) {
    throw new Error('ไม่พบสำนวนที่จัดเก็บแล้ว');
  }
  await prisma.caseArchiveRecord.update({
    where: { caseId },
    data: {
      lifecycleStatus: 'REOPENED',
      archiveStatus: 'PENDING',
      unarchivedAt: new Date(),
      unarchivedByUserId: userId,
      note: reason,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CASE_UNARCHIVED',
      entityType: 'CaseArchiveRecord',
      entityId: record.id,
      beforeValue: JSON.stringify(record),
      afterValue: 'REOPENED',
    },
  });
  await prisma.caseEvent.create({
    data: {
      caseId,
      action: 'UNARCHIVE',
      actorName: userId,
    },
  });
  return true;
}

/** Set or clear legal hold on a case. */
export async function setLegalHold(caseId: string, userId: string, hold: boolean, reason?: string) {
  const record = await prisma.caseArchiveRecord.upsert({
    where: { caseId },
    update: { legalHold: hold, legalHoldReason: reason },
    create: {
      caseId,
      lifecycleStatus: 'ACTIVE',
      archiveStatus: 'PENDING',
      legalHold: hold,
      legalHoldReason: reason,
    },
  });
  const action = hold ? 'CASE_LEGAL_HOLD_SET' : 'CASE_LEGAL_HOLD_REMOVED';
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType: 'CaseArchiveRecord',
      entityId: record.id,
      beforeValue: null,
      afterValue: JSON.stringify({ legalHold: hold, reason }),
    },
  });
  await prisma.caseEvent.create({
    data: {
      caseId,
      action: hold ? 'LEGAL_HOLD_SET' : 'LEGAL_HOLD_REMOVED',
      actorName: userId,
    },
  });
  return record;
}
