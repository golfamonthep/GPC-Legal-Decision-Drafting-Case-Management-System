import fs from 'node:fs';
import path from 'node:path';
import type { ParsedRegistryCaseRow } from './parseRegistryFile';
import { normalizeCaseNumber } from '../registryNumbers';

export interface SnapshotCase {
  id: string;
  type: string;
  blackNumber: string;
  redNumber: string | null;
  registryRedText: string | null;
  petitionerName: string;
  respondentName: string;
  subject: string;
  legalCategory: string;
  legalOfficerName: string | null;
  committeeOwnerName: string | null;
  proceedingNote: string | null;
  receivedDate: string | null; // ISO string in JSON
  dueDate30: string | null;
  dueDate60: string | null;
  dueDate90: string | null;
  dueDate120: string | null;
  dueDate240: string | null;
  meetingDate: string | null;
  currentStatus: string;
  decisionResult: string | null;
  oneDriveUrl: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SnapshotRecentChange {
  type: string;
  blackNumber: string;
  petitionerName: string;
  changeLabel: string;
  proceedingSnippet?: string | null;
  updatedAt: string;
}

export interface CasesSnapshotData {
  updatedAt: string;
  summary: {
    total: number;
    complaint: number;
    appeal: number;
    completed: number;
    pending: number;
    withProceedingNotes?: number;
  };
  recentChanges?: SnapshotRecentChange[];
  cases: SnapshotCase[];
}

const SNAPSHOT_PATH = path.resolve(process.cwd(), 'src/data/cases-snapshot.json');

export function loadCasesSnapshot(): CasesSnapshotData {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return {
      updatedAt: new Date().toISOString(),
      summary: { total: 0, complaint: 0, appeal: 0, completed: 0, pending: 0, withProceedingNotes: 0 },
      recentChanges: [],
      cases: [],
    };
  }

  try {
    const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[CaseSnapshot] Failed to read snapshot file:', err);
    return {
      updatedAt: new Date().toISOString(),
      summary: { total: 0, complaint: 0, appeal: 0, completed: 0, pending: 0, withProceedingNotes: 0 },
      recentChanges: [],
      cases: [],
    };
  }
}

export function saveCasesSnapshot(data: CasesSnapshotData): void {
  const dir = path.dirname(SNAPSHOT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function getHydratedSnapshotCases(): any[] {
  const data = loadCasesSnapshot();
  return data.cases.map(c => ({
    ...c,
    receivedDate: c.receivedDate ? new Date(c.receivedDate) : null,
    dueDate30: c.dueDate30 ? new Date(c.dueDate30) : null,
    dueDate60: c.dueDate60 ? new Date(c.dueDate60) : null,
    dueDate90: c.dueDate90 ? new Date(c.dueDate90) : null,
    dueDate120: c.dueDate120 ? new Date(c.dueDate120) : null,
    dueDate240: c.dueDate240 ? new Date(c.dueDate240) : null,
    meetingDate: c.meetingDate ? new Date(c.meetingDate) : null,
    updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
    legalOfficerId: null,
    legalOfficer: c.legalOfficerName ? { name: c.legalOfficerName } : null,
  }));
}

export function upsertRowsToSnapshot(
  rows: ParsedRegistryCaseRow[],
  caseType: 'ร้องทุกข์' | 'อุทธรณ์'
): {
  updatedCount: number;
  insertedCount: number;
  changedCount: number;
  totalRows: number;
  changedItems: SnapshotRecentChange[];
} {
  const snapshot = loadCasesSnapshot();
  const existingMap = new Map<string, SnapshotCase>();

  snapshot.cases.forEach(c => {
    if (c.type === caseType) {
      existingMap.set(normalizeCaseNumber(c.blackNumber), c);
    }
  });

  let updatedCount = 0;
  let insertedCount = 0;
  let changedCount = 0;
  const changedItems: SnapshotRecentChange[] = [];
  const now = new Date().toISOString();

  for (const r of rows) {
    const normBlack = normalizeCaseNumber(r.blackNumber);
    const existing = existingMap.get(normBlack);

    const safeId = existing?.id || `case-${caseType === 'ร้องทุกข์' ? 'complaint' : 'appeal'}-${normBlack.replace(/\//g, '-')}`;

    const normText = (v: string | null | undefined) =>
      String(v || '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
    const noteChanged = existing ? normText(existing.proceedingNote) !== normText(r.proceedingNote) : Boolean(r.proceedingNote);
    const redChanged = existing ? normText(existing.registryRedText) !== normText(r.registryRedText) : Boolean(r.registryRedText);
    const statusChanged = existing ? normText(existing.currentStatus) !== normText(r.currentStatus) : false;
    const officerChanged = existing ? normText(existing.legalOfficerName) !== normText(r.legalOfficerName) : false;
    const isModified = !existing || noteChanged || redChanged || statusChanged || officerChanged;

    if (isModified) {
      changedCount++;
      const labels: string[] = [];
      if (!existing) labels.push('เพิ่มคดีใหม่');
      else {
        if (noteChanged) labels.push('อัปเดตการดำเนินการ');
        if (redChanged) labels.push(`เรื่องแดง: ${r.registryRedText || '-'}`);
        if (statusChanged && !redChanged) labels.push(`สถานะ: ${r.currentStatus}`);
        if (officerChanged) labels.push(`นิติกร: ${r.legalOfficerName || '-'}`);
      }
      const lastLine = r.proceedingNote
        ? r.proceedingNote.split(/\r?\n/).map(s => s.trim()).filter(Boolean).pop() || r.proceedingNote
        : null;

      changedItems.push({
        type: r.type,
        blackNumber: r.blackNumber,
        petitionerName: r.petitionerName.replace(/\s+/g, ' ').trim(),
        changeLabel: labels.join(', ') || 'อัปเดตข้อมูล',
        proceedingSnippet: lastLine ? lastLine.slice(0, 90) : null,
        updatedAt: now,
      });
    }

    const updatedCase: SnapshotCase = {
      id: safeId,
      type: r.type,
      blackNumber: r.blackNumber,
      redNumber: r.redNumber,
      registryRedText: r.registryRedText,
      petitionerName: r.petitionerName,
      respondentName: r.respondentName,
      subject: r.subject,
      legalCategory: r.legalCategory || 'ทั่วไป',
      legalOfficerName: r.legalOfficerName,
      committeeOwnerName: r.committeeOwnerName,
      proceedingNote: r.proceedingNote,
      receivedDate: r.receivedDate ? r.receivedDate.toISOString() : (existing?.receivedDate || null),
      dueDate30: r.dueDate30 ? r.dueDate30.toISOString() : (existing?.dueDate30 || null),
      dueDate60: r.dueDate60 ? r.dueDate60.toISOString() : (existing?.dueDate60 || null),
      dueDate90: r.dueDate90 ? r.dueDate90.toISOString() : (existing?.dueDate90 || null),
      dueDate120: r.dueDate120 ? r.dueDate120.toISOString() : (existing?.dueDate120 || null),
      dueDate240: r.dueDate240 ? r.dueDate240.toISOString() : (existing?.dueDate240 || null),
      meetingDate: r.meetingDate ? r.meetingDate.toISOString() : (existing?.meetingDate || null),
      currentStatus: r.currentStatus,
      decisionResult: r.decisionResult,
      oneDriveUrl: r.oneDriveUrl,
      remarks: r.remarks || existing?.remarks || null,
      createdAt: existing?.createdAt || now,
      updatedAt: isModified ? now : (existing?.updatedAt || now),
    };

    if (existing) {
      const idx = snapshot.cases.findIndex(c => c.id === existing.id);
      if (idx !== -1) {
        snapshot.cases[idx] = updatedCase;
      }
      updatedCount++;
    } else {
      snapshot.cases.push(updatedCase);
      existingMap.set(normBlack, updatedCase);
      insertedCount++;
    }
  }

  // Recalculate summary
  const complaintCases = snapshot.cases.filter(c => c.type === 'ร้องทุกข์');
  const appealCases = snapshot.cases.filter(c => c.type === 'อุทธรณ์');
  const completedCases = snapshot.cases.filter(c => c.currentStatus === 'เสร็จสิ้น');
  const withNotesCases = snapshot.cases.filter(c => c.proceedingNote && c.proceedingNote.trim() !== '');

  snapshot.updatedAt = now;
  snapshot.summary = {
    total: snapshot.cases.length,
    complaint: complaintCases.length,
    appeal: appealCases.length,
    completed: completedCases.length,
    pending: snapshot.cases.length - completedCases.length,
    withProceedingNotes: withNotesCases.length,
  };

  if (changedItems.length > 0) {
    const prev = (snapshot.recentChanges || []).filter(
      old => !changedItems.some(n => n.type === old.type && normalizeCaseNumber(n.blackNumber) === normalizeCaseNumber(old.blackNumber))
    );
    snapshot.recentChanges = [...changedItems, ...prev].slice(0, 20);
  } else if (!snapshot.recentChanges) {
    snapshot.recentChanges = [];
  }

  saveCasesSnapshot(snapshot);

  return {
    updatedCount,
    insertedCount,
    changedCount,
    totalRows: rows.length,
    changedItems,
  };
}
