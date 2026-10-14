import type { PrismaClient } from '../generated/prisma';
import { ROLE_PERMISSIONS, type Role } from './auth/permissions';
import { validateCaseRecord, CaseInputError } from './caseEditor';
import { getRegistryCaseStatus } from './caseStatus';

type Actor = { id: string; name?: string | null; email?: string | null; role: string; status?: string };
export async function saveCaseRecord(db: PrismaClient, actor: Actor, input: unknown, id?: string) {
  const permission = id ? 'EDIT_CASE' : 'IMPORT_REGISTRY';
  if (!actor || actor.status !== 'ACTIVE' || !ROLE_PERMISSIONS[actor.role as Role]?.includes(permission)) throw new CaseInputError('คุณไม่มีสิทธิ์บันทึกข้อมูลคดี', 403);
  const data = validateCaseRecord(input);
  const expected = (input as Record<string, unknown>).expectedUpdatedAt;
  if (id && (typeof expected !== 'string' || Number.isNaN(Date.parse(expected)))) throw new CaseInputError('กรุณาเปิดข้อมูลล่าสุดก่อนแก้ไข', 409);
  return db.$transaction(async tx => {
    const before = id ? await tx.case.findUnique({ where: { id } }) : null;
    if (id && !before) throw new CaseInputError('ไม่พบข้อมูลคดี', 404);
    if (before && data.registryRedText === (before.registryRedText?.trim() || null) && !data.redNumber && before.redNumber) data.redNumber = before.redNumber;
    let saved;
    if (id && before) {
      const updated = await tx.case.updateMany({ where: { id, updatedAt: new Date(expected as string) }, data });
      if (!updated.count) throw new CaseInputError('ข้อมูลถูกเปลี่ยนแปลงโดยผู้ใช้อื่น กรุณาเปิดข้อมูลล่าสุดและตรวจทานก่อนบันทึก', 409);
      saved = await tx.case.findUniqueOrThrow({ where: { id } });
    } else saved = await tx.case.create({ data });
    await tx.caseEvent.create({ data: { caseId: saved.id, action: id ? 'แก้ไขข้อมูลทะเบียนและการดำเนินการ' : 'เพิ่มเรื่องในทะเบียน', actorName: actor.name || actor.email || 'ผู้ใช้งานระบบ' } });
    await tx.auditLog.create({ data: {
      userId: actor.id.startsWith('mvp-') ? null : actor.id, action: id ? 'CASE_UPDATED' : 'CASE_CREATED',
      entityType: 'Case', entityId: saved.id,
      beforeValue: before ? JSON.stringify(Object.fromEntries(Object.keys(data).map(key => [key, before[key as keyof typeof before]]))) : null,
      afterValue: JSON.stringify(data),
    } });
    return saved;
  });
}

export async function saveCaseProgress(db: PrismaClient, actor: Actor, input: unknown, id: string) {
  if (!actor || actor.status !== 'ACTIVE' || !ROLE_PERMISSIONS[actor.role as Role]?.includes('EDIT_CASE')) throw new CaseInputError('คุณไม่มีสิทธิ์บันทึกข้อมูลคดี', 403);
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new CaseInputError('ข้อมูลไม่ถูกต้อง');
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some(key => !['currentStatus','proceedingNote','expectedUpdatedAt'].includes(key)) ||
      typeof body.currentStatus !== 'string' || !body.currentStatus.trim() || body.currentStatus.length > 500 ||
      typeof body.proceedingNote !== 'string' || body.proceedingNote.length > 10000) throw new CaseInputError('กรุณาระบุสถานะและรายละเอียดการดำเนินการที่ถูกต้อง');
  if (typeof body.expectedUpdatedAt !== 'string' || Number.isNaN(Date.parse(body.expectedUpdatedAt))) throw new CaseInputError('กรุณาเปิดข้อมูลล่าสุดก่อนแก้ไข', 409);
  const expected = new Date(body.expectedUpdatedAt);
  const status = body.currentStatus.trim(), note = body.proceedingNote.trim() || null;
  return db.$transaction(async tx => {
    const before = await tx.case.findUnique({ where: { id } });
    if (!before) throw new CaseInputError('ไม่พบข้อมูลคดี', 404);
    const data = { currentStatus: getRegistryCaseStatus({ ...before, currentStatus: status }), proceedingNote: note };
    const updated = await tx.case.updateMany({ where: { id, updatedAt: expected }, data });
    if (!updated.count) throw new CaseInputError('ข้อมูลถูกเปลี่ยนแปลงโดยผู้ใช้อื่น กรุณาเปิดข้อมูลล่าสุดและตรวจทานก่อนบันทึก', 409);
    const saved = await tx.case.findUniqueOrThrow({ where: { id } });
    await tx.caseEvent.create({ data: { caseId: id, action: 'อัปเดตสถานะและการดำเนินการ', actorName: actor.name || actor.email || 'ผู้ใช้งานระบบ' } });
    await tx.auditLog.create({ data: { userId: actor.id.startsWith('mvp-') ? null : actor.id, action: 'CASE_STATUS_UPDATED', entityType: 'Case', entityId: id, beforeValue: JSON.stringify({ currentStatus: before.currentStatus, proceedingNote: before.proceedingNote }), afterValue: JSON.stringify(data) } });
    return saved;
  });
}
