import * as XLSX from 'xlsx';
import { normalizeCaseNumber, extractStoredRedNumber } from '../registryNumbers';
import { parseThaiDate } from '../dateUtils';
import { getRegistryCaseStatus } from '../caseStatus';

export interface ParsedRegistryCaseRow {
  index: number;
  type: 'ร้องทุกข์' | 'อุทธรณ์';
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
  receivedDate: Date | null;
  dueDate30: Date | null;
  dueDate60: Date | null;
  dueDate90: Date | null;
  dueDate120: Date | null;
  dueDate240: Date | null;
  meetingDate: Date | null;
  currentStatus: string;
  decisionResult: string | null;
  oneDriveUrl: string | null;
  remarks: string | null;
  raw: Record<string, any>;
}

export interface ParseRegistryResult {
  success: boolean;
  fileName: string;
  caseType: 'ร้องทุกข์' | 'อุทธรณ์';
  totalRows: number;
  rows: ParsedRegistryCaseRow[];
  error?: string;
}

export function parseRegistryWorkbook(buffer: Buffer | ArrayBuffer | Uint8Array, fileName: string): ParseRegistryResult {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    return {
      success: false,
      fileName,
      caseType: 'ร้องทุกข์',
      totalRows: 0,
      rows: [],
      error: 'ไม่พบชีตในไฟล์เอกสาร',
    };
  }

  // 1. Determine caseType from filename
  let detectedType: 'ร้องทุกข์' | 'อุทธรณ์' = 'ร้องทุกข์';
  if (fileName.includes('อุทธรณ์')) {
    detectedType = 'อุทธรณ์';
  } else if (fileName.includes('ร้องทุกข์')) {
    detectedType = 'ร้องทุกข์';
  }

  // 2. Select priority sheet
  let targetSheetName = wb.SheetNames[0];
  const prioritySheets = detectedType === 'อุทธรณ์'
    ? ['พ.ศ.2567', 'พ.ศ.2568', 'พ.ศ.2569', 'ทะเบียนคุมทั้งหมด', 'Sheet1']
    : ['ทะเบียนคุมทั้งหมด', 'ร้องทุกข์', 'Sheet1', 'Sheet 1'];

  for (const s of prioritySheets) {
    if (wb.SheetNames.includes(s)) {
      targetSheetName = s;
      break;
    }
  }

  const ws = wb.Sheets[targetSheetName];
  if (!ws) {
    return {
      success: false,
      fileName,
      caseType: detectedType,
      totalRows: 0,
      rows: [],
      error: `ไม่สามารถเปิดชีต ${targetSheetName} ได้`,
    };
  }

  const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
  if (rawRows.length === 0) {
    return {
      success: false,
      fileName,
      caseType: detectedType,
      totalRows: 0,
      rows: [],
      error: 'ไม่พบข้อมูลในชีต',
    };
  }

  // 3. Find header row
  let headerIndex = -1;
  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    const row = rawRows[i].map(c => String(c).trim());
    if (row.some(c => c.includes('เรื่องดำ') || c.includes('หมายเลขดำ') || c.includes('ผู้ร้อง') || c.includes('ผู้อุทธรณ์'))) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) headerIndex = 0;

  const headers = rawRows[headerIndex].map(c => String(c).trim().replace(/\r?\n/g, ' '));

  // If case type not detected from filename, infer from headers
  if (headers.some(h => h.includes('ผู้อุทธรณ์') || h.includes('คำสั่งที่อุทธรณ์'))) {
    detectedType = 'อุทธรณ์';
  }

  // 4. Map columns
  const colMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    if (!h) return;
    if (h.includes('เรื่องดำ') || h.includes('หมายเลขดำ') || h === 'ดำ' || h === 'หมายเลขคดีดำ') colMap.blackNumber = idx;
    else if (h.includes('เรื่องแดง') || h.includes('หมายเลขแดง') || h === 'แดง' || h === 'หมายเลขคดีแดง') colMap.redNumber = idx;
    else if (h.includes('ผู้ร้องทุกข์') || h.includes('ผู้อุทธรณ์') || h.includes('ผู้ร้อง') || h.includes('ชื่อผู้ร้อง')) colMap.petitioner = idx;
    else if (h.includes('เรื่องที่ร้อง') || h.includes('คำสั่งที่อุทธรณ์') || h === 'เรื่อง') colMap.subject = idx;
    else if (h.includes('คู่กรณี')) colMap.respondent = idx;
    else if (h.includes('วันรับ') || h.includes('วันที่รับ')) colMap.receivedDate = idx;
    else if (h.includes('วันมีมติ') || h.includes('เข้าประชุม') || h.includes('วันประชุม') || h.includes('วันนัดพิจารณา')) colMap.meetingDate = idx;
    else if (h.includes('การดำเนินการ') || h.includes('บันทึก')) colMap.proceedingNote = idx;
    else if (h.includes('นิติกร') || h.includes('ผู้รับผิดชอบ') || h.includes('เจ้าของสำนวน')) colMap.legalOfficer = idx;
    else if (h.includes('กรรมการ') || h.includes('กรรมการเจ้าของสำนวน')) colMap.commissioner = idx;
    else if (h.includes('สถานะ')) colMap.status = idx;
    else if (h.includes('ผลคำวินิจฉัย') || h.includes('ผลการร้อง')) colMap.decisionResult = idx;
    else if (h.toLowerCase().includes('onedrive') || h.includes('ลิงก์ onedrive')) colMap.oneDrive = idx;
    else if (h.includes('ครบ 30')) colMap.due30 = idx;
    else if (h.includes('ครบ 60')) colMap.due60 = idx;
    else if (h.includes('ครบ 90')) colMap.due90 = idx;
    else if (h.includes('ครบ 120')) colMap.due120 = idx;
    else if (h.includes('ครบ 240')) colMap.due240 = idx;
    else if (h.includes('หมายเหตุ')) colMap.remarks = idx;
  });

  // 5. Extract rows
  const parsedRows: ParsedRegistryCaseRow[] = [];

  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const r = rawRows[i];
    const rawBlack = colMap.blackNumber !== undefined ? String(r[colMap.blackNumber] || '').trim() : '';
    
    // Ignore footer or title rows
    if (!rawBlack) continue;
    if (rawBlack.includes('เรื่องดำ') || rawBlack.includes('เรื่องแดง') || rawBlack.includes('ทั้งหมด') || rawBlack === 'ลำดับ') continue;
    if (!/\d/.test(rawBlack) && !(colMap.petitioner !== undefined && r[colMap.petitioner])) continue;

    const blackNumber = normalizeCaseNumber(rawBlack);
    const rawRed = colMap.redNumber !== undefined ? String(r[colMap.redNumber] || '').trim() : '';
    const redNumber = extractStoredRedNumber(rawRed);
    const registryRedText = rawRed || null;

    const rawStatus = colMap.status !== undefined ? String(r[colMap.status] || '').trim() : '';
    const currentStatus = getRegistryCaseStatus({ registryRedText: rawRed, currentStatus: rawStatus });

    const rawPetitioner = colMap.petitioner !== undefined ? String(r[colMap.petitioner] || '').trim() : '';
    const rawRespondent = colMap.respondent !== undefined ? String(r[colMap.respondent] || '').trim() : '';
    const rawSubject = colMap.subject !== undefined ? String(r[colMap.subject] || '').trim() : '';
    const rawOfficer = colMap.legalOfficer !== undefined ? String(r[colMap.legalOfficer] || '').trim() : '';
    const rawCommissioner = colMap.commissioner !== undefined ? String(r[colMap.commissioner] || '').trim() : '';
    const rawNote = colMap.proceedingNote !== undefined ? String(r[colMap.proceedingNote] || '').trim() : '';
    const rawDecision = colMap.decisionResult !== undefined ? String(r[colMap.decisionResult] || '').trim() : '';
    const rawOneDrive = colMap.oneDrive !== undefined ? String(r[colMap.oneDrive] || '').trim() : '';
    const rawRemarks = colMap.remarks !== undefined ? String(r[colMap.remarks] || '').trim() : '';

    const rowObj: ParsedRegistryCaseRow = {
      index: i + 1,
      type: detectedType,
      blackNumber,
      redNumber,
      registryRedText,
      petitionerName: rawPetitioner || 'ไม่ระบุ',
      respondentName: rawRespondent || 'ไม่ระบุ',
      subject: rawSubject || 'ไม่ระบุ',
      legalCategory: detectedType === 'อุทธรณ์' ? 'อุทธรณ์คำสั่ง' : 'ร้องทุกข์',
      legalOfficerName: rawOfficer || null,
      committeeOwnerName: rawCommissioner || null,
      proceedingNote: rawNote || null,
      receivedDate: colMap.receivedDate !== undefined ? parseThaiDate(r[colMap.receivedDate]) : null,
      dueDate30: colMap.due30 !== undefined ? parseThaiDate(r[colMap.due30]) : null,
      dueDate60: colMap.due60 !== undefined ? parseThaiDate(r[colMap.due60]) : null,
      dueDate90: colMap.due90 !== undefined ? parseThaiDate(r[colMap.due90]) : null,
      dueDate120: colMap.due120 !== undefined ? parseThaiDate(r[colMap.due120]) : null,
      dueDate240: colMap.due240 !== undefined ? parseThaiDate(r[colMap.due240]) : null,
      meetingDate: colMap.meetingDate !== undefined ? parseThaiDate(r[colMap.meetingDate]) : null,
      currentStatus,
      decisionResult: rawDecision || null,
      oneDriveUrl: rawOneDrive || null,
      remarks: rawRemarks || null,
      raw: {
        blackCaseNo: rawBlack,
        redCaseNo: rawRed,
        complainantName: rawPetitioner,
        accusedName: rawRespondent,
        subject: rawSubject,
        legalOfficer: rawOfficer,
        commissioner: rawCommissioner,
        proceedingNote: rawNote,
        status: rawStatus,
        decisionResult: rawDecision,
        oneDriveUrl: rawOneDrive,
      },
    };

    parsedRows.push(rowObj);
  }

  return {
    success: true,
    fileName,
    caseType: detectedType,
    totalRows: parsedRows.length,
    rows: parsedRows,
  };
}
