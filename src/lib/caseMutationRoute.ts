import 'server-only';
import { NextResponse } from 'next/server';
import prisma from './db';
import { requireApiPermission } from './auth/requireApiPermission';
import { saveCaseRecord, saveCaseProgress } from './caseMutation';
import { CaseInputError } from './caseEditor';
import { assertSameOrigin } from './analysis/safety.mjs';

export async function handleCaseMutation(request: Request, id?: string, progress = false) {
  try {
    const actor = await requireApiPermission(id ? 'EDIT_CASE' : 'IMPORT_REGISTRY');
    assertSameOrigin(request.headers.get('origin'), request.headers.get('host'), process.env.NODE_ENV === 'production');
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new CaseInputError('รูปแบบข้อมูลไม่ถูกต้อง', 415);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 65536) throw new CaseInputError('ข้อมูลยาวเกินขีดจำกัด', 413);
    let input: unknown;
    try { input = JSON.parse(raw); } catch { throw new CaseInputError('ข้อมูล JSON ไม่ถูกต้อง'); }
    const saved = progress && id ? await saveCaseProgress(prisma, actor, input, id) : await saveCaseRecord(prisma, actor, input, id);
    return NextResponse.json({ success: true, case: { id: saved.id, currentStatus: saved.currentStatus, proceedingNote: saved.proceedingNote, updatedAt: saved.updatedAt }, message: id ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มเรื่องแล้ว' }, { status: id ? 200 : 201 });
  } catch (error) {
    const e = error as { message?: string; code?: string; status?: number };
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ message: 'คุณไม่มีสิทธิ์บันทึกข้อมูลคดี' }, { status: 403 });
    if (e.code === 'P2002') return NextResponse.json({ message: 'เรื่องดำหรือเลขเรื่องแดงซ้ำในทะเบียนประเภทเดียวกัน กรุณาตรวจสอบข้อมูล' }, { status: 409 });
    if (e.status && e.status < 500) return NextResponse.json({ message: e.message }, { status: e.status });
    return NextResponse.json({ message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่ หากยังพบปัญหาให้แจ้งผู้ดูแลระบบ' }, { status: 503 });
  }
}
