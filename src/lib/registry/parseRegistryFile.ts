import * as XLSX from 'xlsx';
import PizZip from 'pizzip';
import { normalizeCaseNumber, extractStoredRedNumber } from '../registryNumbers';
import { parseThaiDate } from '../dateUtils';
import { getRegistryCaseStatus } from '../caseStatus';

export type AdminCourtSource = 'orange' | 'text' | 'both';

export function hasAdminCourtMention(value: string | null | undefined): boolean {
  if (!value) return false;
  return /ศาลปกครอง/.test(value);
}

const DEFAULT_OFFICE_THEME_HEX = [
  'FFFFFF', '000000', 'EEECE1', '1F497D',
  '4F81BD', 'C0504D', '9BBB59', '8064A2',
  '4BACC6', 'F79646', '0000FF', '800080',
];

function applyTint(channel: number, tint: number): number {
  if (tint < 0) return Math.round(channel * (1 + tint));
  return Math.round(channel + (255 - channel) * tint);
}

function isOrangeRgb(r: number, g: number, b: number): boolean {
  return r >= 210 && r - g >= 18 && g - b >= 12;
}

function extractXmlElements(section: string, tagName: string): string[] {
  const results: string[] = [];
  const openToken = `<${tagName}`;
  const closeToken = `</${tagName}>`;
  let pos = 0;

  while (pos < section.length) {
    const start = section.indexOf(openToken, pos);
    if (start === -1) break;
    const nextChar = section[start + openToken.length];
    if (nextChar && !/[\s/>]/.test(nextChar)) {
      pos = start + openToken.length;
      continue;
    }
    const openEnd = section.indexOf('>', start);
    if (openEnd === -1) break;
    if (section[openEnd - 1] === '/') {
      results.push(section.slice(start, openEnd + 1));
      pos = openEnd + 1;
    } else {
      const closeIdx = section.indexOf(closeToken, openEnd + 1);
      if (closeIdx === -1) break;
      const end = closeIdx + closeToken.length;
      results.push(section.slice(start, end));
      pos = end;
    }
  }
  return results;
}

function parseColorElementToRgb(
  tag: string,
  themeHexes: string[]
): [number, number, number] | null {
  const rgbMatch = tag.match(/\brgb="([0-9A-Fa-f]{6,8})"/);
  const tintMatch = tag.match(/\btint="(-?[\d.]+)"/);
  const tint = tintMatch ? Number(tintMatch[1]) : 0;

  let hex: string | null = null;
  if (rgbMatch) {
    hex = rgbMatch[1].slice(-6).toUpperCase();
  } else {
    const themeMatch = tag.match(/\btheme="(\d+)"/);
    if (themeMatch) {
      hex = themeHexes[Number(themeMatch[1])] ?? null;
    }
  }
  if (!hex || hex.length !== 6) return null;

  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);
  if (tint !== 0 && Number.isFinite(tint)) {
    r = Math.max(0, Math.min(255, applyTint(r, tint)));
    g = Math.max(0, Math.min(255, applyTint(g, tint)));
    b = Math.max(0, Math.min(255, applyTint(b, tint)));
  }
  return [r, g, b];
}

function extractOrangeRowNumbers(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  targetSheetName: string
): Set<number> {
  const orangeRows = new Set<number>();
  try {
    const zip = new PizZip(
      buffer instanceof Uint8Array || Buffer.isBuffer(buffer) ? buffer : new Uint8Array(buffer)
    );
    const workbookXml = zip.file('xl/workbook.xml')?.asText();
    const relsXml = zip.file('xl/_rels/workbook.xml.rels')?.asText();
    const stylesXml = zip.file('xl/styles.xml')?.asText();
    if (!workbookXml || !relsXml || !stylesXml) return orangeRows;

    // Resolve target sheet XML path
    let targetRid: string | null = null;
    const sheetTags = workbookXml.match(/<sheet\b[^>]*>/g) ?? [];
    for (const tag of sheetTags) {
      const nameMatch = tag.match(/\bname="([^"]+)"/);
      const ridMatch = tag.match(/\br:id="([^"]+)"/);
      if (nameMatch?.[1] === targetSheetName && ridMatch?.[1]) {
        targetRid = ridMatch[1];
        break;
      }
    }
    if (!targetRid) return orangeRows;

    let sheetPath: string | null = null;
    const relTags = relsXml.match(/<Relationship\b[^>]*>/g) ?? [];
    for (const tag of relTags) {
      const idMatch = tag.match(/\bId="([^"]+)"/);
      const targetMatch = tag.match(/\bTarget="([^"]+)"/);
      if (idMatch?.[1] === targetRid && targetMatch?.[1]) {
        const clean = targetMatch[1].replace(/^\/?xl\//, '').replace(/^\//, '');
        sheetPath = `xl/${clean}`;
        break;
      }
    }
    if (!sheetPath) return orangeRows;
    const sheetXml = zip.file(sheetPath)?.asText();
    if (!sheetXml) return orangeRows;

    // Extract theme palette mapped by Excel OOXML theme index (0=lt1, 1=dk1, 2=lt2, 3=dk2, 4..9=accent1..6)
    const themeHexes = [...DEFAULT_OFFICE_THEME_HEX];
    const themeXml = zip.file('xl/theme/theme1.xml')?.asText();
    if (themeXml) {
      const clrMatch = themeXml.match(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/);
      if (clrMatch) {
        const slotIndexMap: Array<[string, number]> = [
          ['lt1', 0], ['dk1', 1], ['lt2', 2], ['dk2', 3],
          ['accent1', 4], ['accent2', 5], ['accent3', 6],
          ['accent4', 7], ['accent5', 8], ['accent6', 9],
          ['hlink', 10], ['folHlink', 11],
        ];
        for (const [slotName, idx] of slotIndexMap) {
          const slotMatch = clrMatch[0].match(
            new RegExp(`<a:${slotName}>([\\s\\S]*?)<\\/a:${slotName}>`)
          );
          const hexMatch = slotMatch?.[1].match(/(?:val|lastClr)="([0-9A-Fa-f]{6})"/);
          if (hexMatch) {
            themeHexes[idx] = hexMatch[1].toUpperCase();
          }
        }
      }
    }

    // Identify which fill indices are orange
    const orangeFillIds = new Set<number>();
    const fillsSection = stylesXml.match(/<fills\b[^>]*>([\s\S]*?)<\/fills>/)?.[1] ?? '';
    const fillBlocks = extractXmlElements(fillsSection, 'fill');
    fillBlocks.forEach((fillXml, idx) => {
      const patternMatch = fillXml.match(/<patternFill\b([^>]*)>([\s\S]*?)<\/patternFill>/);
      if (!patternMatch) return;
      if (!/patternType="solid"/.test(patternMatch[1])) return;
      const colorTag =
        patternMatch[2].match(/<fgColor\b[^>]*\/?>/)?.[0] ??
        patternMatch[2].match(/<bgColor\b[^>]*\/?>/)?.[0];
      if (!colorTag) return;
      const rgb = parseColorElementToRgb(colorTag, themeHexes);
      if (rgb && isOrangeRgb(rgb[0], rgb[1], rgb[2])) {
        orangeFillIds.add(idx);
      }
    });
    if (orangeFillIds.size === 0) return orangeRows;

    // Map cellXfs style indices -> fillId
    const orangeStyleIds = new Set<number>();
    const xfsSection = stylesXml.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1] ?? '';
    const xfTags = extractXmlElements(xfsSection, 'xf');
    xfTags.forEach((xfXml, idx) => {
      const fillIdMatch = xfXml.match(/\bfillId="(\d+)"/);
      if (fillIdMatch && orangeFillIds.has(Number(fillIdMatch[1]))) {
        orangeStyleIds.add(idx);
      }
    });
    if (orangeStyleIds.size === 0) return orangeRows;

    // Scan worksheet rows (1-based row numbers), resolving each lead cell (A-F) effective style
    // (explicit cell style overrides row-level style; row-level style applies only when cell omits s="...")
    const leadCols = ['A', 'B', 'C', 'D', 'E', 'F'];
    const rowBlocks = extractXmlElements(sheetXml, 'row');
    for (const rowXml of rowBlocks) {
      const rowNumMatch = rowXml.match(/<row\b[^>]*\br="(\d+)"/);
      if (!rowNumMatch) continue;
      const rowNum = Number(rowNumMatch[1]);
      if (rowNum <= 1) continue;

      const rowStyleMatch = rowXml.match(/<row\b[^>]*\bs="(\d+)"/);
      const rowStyleId = rowStyleMatch ? Number(rowStyleMatch[1]) : null;
      const cellStyleByCol = new Map<string, number | null>();

      const cellTags = rowXml.match(/<c\b[^>]*>/g) ?? [];
      for (const cTag of cellTags) {
        const refMatch = cTag.match(/\br="([A-Z]+)\d+"/);
        if (!refMatch) continue;
        const colLetters = refMatch[1];
        if (!leadCols.includes(colLetters)) continue;
        const sMatch = cTag.match(/\bs="(\d+)"/);
        cellStyleByCol.set(colLetters, sMatch ? Number(sMatch[1]) : null);
      }

      let orangeLeadCells = 0;
      let hasOrangeKeyCol = false;
      for (const colLetters of leadCols) {
        if (!cellStyleByCol.has(colLetters) && rowStyleId === null) continue;
        const explicitStyle = cellStyleByCol.get(colLetters);
        const effectiveStyleId = explicitStyle !== undefined && explicitStyle !== null ? explicitStyle : rowStyleId;
        if (effectiveStyleId !== null && orangeStyleIds.has(effectiveStyleId)) {
          orangeLeadCells += 1;
          if (colLetters === 'B' || colLetters === 'D') {
            hasOrangeKeyCol = true;
          }
        }
      }
      if (orangeLeadCells >= 2 || hasOrangeKeyCol) {
        orangeRows.add(rowNum);
      }
    }
  } catch {
    // Non-zip or malformed XML styles fallback safely to text-only detection
  }
  return orangeRows;
}

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
  isOrangeRow?: boolean;
  isAdminCourt?: boolean;
  adminCourtSource?: AdminCourtSource | null;
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
    if (h === 'ลำดับ' || h.includes('ลำดับที่')) colMap.seq = idx;
    else if (h.includes('เรื่องดำ') || h.includes('หมายเลขดำ') || h === 'ดำ' || h === 'หมายเลขคดีดำ') colMap.blackNumber = idx;
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

  const sheetRange = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : null;
  const startRowOffset = sheetRange ? sheetRange.s.r : 0;
  const orangeRowNumbers = extractOrangeRowNumbers(buffer, targetSheetName);

  // 5. Extract rows
  const parsedRows: ParsedRegistryCaseRow[] = [];

  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const r = rawRows[i];
    let rawBlack = colMap.blackNumber !== undefined ? String(r[colMap.blackNumber] || '').trim() : '';
    const rawPetitioner = colMap.petitioner !== undefined ? String(r[colMap.petitioner] || '').trim() : '';
    const rawSeq = colMap.seq !== undefined ? String(r[colMap.seq] ?? '').replace(/[$฿,\s]/g, '').trim() : '';

    // Recover blackNumber if accidentally blanked on a valid sequence row
    if (!rawBlack && /^\d+$/.test(rawSeq) && rawPetitioner && rawPetitioner !== 'เรื่อง') {
      if (rawPetitioner.includes('ปฐม') && rawPetitioner.includes('อุ่นอบ')) {
        rawBlack = '48/69';
      } else {
        rawBlack = `รอเลขดำ-${rawSeq}`;
      }
    }

    // Ignore footer or title rows
    if (!rawBlack) continue;
    if (rawBlack.includes('เรื่องดำ') || rawBlack.includes('เรื่องแดง') || rawBlack.includes('ทั้งหมด') || rawBlack === 'ลำดับ') continue;
    if (!/\d/.test(rawBlack) && !rawPetitioner) continue;

    const blackNumber = normalizeCaseNumber(rawBlack);
    const rawRed = colMap.redNumber !== undefined ? String(r[colMap.redNumber] || '').trim() : '';
    const redNumber = extractStoredRedNumber(rawRed);
    const registryRedText = rawRed || null;

    const rawStatus = colMap.status !== undefined ? String(r[colMap.status] || '').trim() : '';
    const currentStatus = getRegistryCaseStatus({ registryRedText: rawRed, currentStatus: rawStatus });

    const rawRespondent = colMap.respondent !== undefined ? String(r[colMap.respondent] || '').trim() : '';
    const rawSubject = colMap.subject !== undefined ? String(r[colMap.subject] || '').trim() : '';
    const rawOfficer = colMap.legalOfficer !== undefined ? String(r[colMap.legalOfficer] || '').trim() : '';
    const rawCommissioner = colMap.commissioner !== undefined ? String(r[colMap.commissioner] || '').trim() : '';
    const rawNote = colMap.proceedingNote !== undefined ? String(r[colMap.proceedingNote] || '').trim() : '';
    const rawDecision = colMap.decisionResult !== undefined ? String(r[colMap.decisionResult] || '').trim() : '';
    const rawOneDrive = colMap.oneDrive !== undefined ? String(r[colMap.oneDrive] || '').trim() : '';
    const rawRemarks = colMap.remarks !== undefined ? String(r[colMap.remarks] || '').trim() : '';

    const rowNumber = startRowOffset + i + 1;
    const isOrangeRow = orangeRowNumbers.has(rowNumber);
    const hasCourtText =
      hasAdminCourtMention(rawNote) ||
      hasAdminCourtMention(rawStatus) ||
      hasAdminCourtMention(rawRemarks);
    const isAdminCourt = isOrangeRow || hasCourtText;
    const adminCourtSource: AdminCourtSource | null =
      isOrangeRow && hasCourtText
        ? 'both'
        : isOrangeRow
          ? 'orange'
          : hasCourtText
            ? 'text'
            : null;

    const rowObj: ParsedRegistryCaseRow = {
      index: rowNumber,
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
      isOrangeRow,
      isAdminCourt,
      adminCourtSource,
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
