import { getRegistryCaseStatus } from './caseStatus';
import { normalizeCaseNumber, extractStoredRedNumber } from './registryNumbers';

export class CaseInputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

const fields = ['type','blackNumber','registryRedText','petitionerName','respondentName','subject','legalCategory','legalOfficerName','currentStatus','proceedingNote','decisionResult'] as const;
export function validateCaseRecord(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new CaseInputError('ข้อมูลคดีไม่ถูกต้อง');
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some(key => ![...fields, 'expectedUpdatedAt'].includes(key as typeof fields[number]))) throw new CaseInputError('พบช่องข้อมูลที่ไม่อนุญาตให้แก้ไข');
  const value = (key: typeof fields[number], required = false, max = 500) => {
    if (body[key] !== undefined && body[key] !== null && typeof body[key] !== 'string') throw new CaseInputError('รูปแบบข้อมูลไม่ถูกต้อง');
    const text = ((body[key] as string | undefined) ?? '').trim();
    if (text.length > max) throw new CaseInputError('ข้อมูลยาวเกินขีดจำกัด');
    if (required && !text) throw new CaseInputError('กรุณากรอกประเภท เรื่องดำ ชื่อผู้ร้อง/ผู้อุทธรณ์ และเรื่องให้ครบ');
    return text;
  };
  const type = value('type', true);
  if (!['ร้องทุกข์','อุทธรณ์'].includes(type)) throw new CaseInputError('ประเภทคดีไม่ถูกต้อง');
  const red = value('registryRedText');
  const currentStatus = getRegistryCaseStatus({ registryRedText: red, currentStatus: value('currentStatus') || 'รับเรื่อง' });
  return {
    type, blackNumber: normalizeCaseNumber(value('blackNumber', true, 100)),
    registryRedText: red || null,
    redNumber: extractStoredRedNumber(red),
    petitionerName: value('petitionerName', true),
    respondentName: value('respondentName') || 'ยังไม่ระบุ',
    subject: value('subject', true, 2000),
    legalCategory: value('legalCategory'),
    legalOfficerName: value('legalOfficerName') || null,
    currentStatus,
    proceedingNote: value('proceedingNote', false, 10000) || null,
    decisionResult: value('decisionResult', false, 2000) || null,
  };
}
