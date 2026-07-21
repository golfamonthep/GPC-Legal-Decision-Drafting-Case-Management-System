import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { hasRedCaseNumber, isClosedCaseStatus } from '@/lib/caseStatus';

const MAX_NOTE_LENGTH = 10000;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiPermission('EDIT_CASE');
    const { id } = await context.params;
    const body = await request.json();

    const requestedStatus = String(body?.currentStatus ?? '').trim();
    const proceedingNote = String(body?.proceedingNote ?? '').trim();

    if (!requestedStatus) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', message: 'กรุณาระบุสถานะคดี' },
        { status: 400 },
      );
    }

    if (proceedingNote.length > MAX_NOTE_LENGTH) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', message: 'รายละเอียดการดำเนินการยาวเกิน 10,000 ตัวอักษร' },
        { status: 400 },
      );
    }

    const existingCase = await prisma.case.findUnique({
      where: { id },
      select: {
        id: true,
        blackNumber: true,
        redNumber: true,
        currentStatus: true,
        proceedingNote: true,
      },
    });

    if (!existingCase) {
      return NextResponse.json(
        { success: false, code: 'NOT_FOUND', message: 'ไม่พบข้อมูลคดีที่ต้องการอัปเดต' },
        { status: 404 },
      );
    }

    const normalizedStatus = hasRedCaseNumber(existingCase.redNumber) && !isClosedCaseStatus(requestedStatus)
      ? 'เสร็จสิ้น'
      : requestedStatus;

    const actorName = user.name || user.email || 'MVP User';
    const auditUserId = user.id.startsWith('mvp-') ? null : user.id;
    const actionDescription = proceedingNote
      ? `อัปเดตสถานะเป็น “${normalizedStatus}” — ${proceedingNote}`
      : `อัปเดตสถานะเป็น “${normalizedStatus}”`;

    const updatedCase = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.case.update({
        where: { id },
        data: {
          currentStatus: normalizedStatus,
          proceedingNote: proceedingNote || null,
        },
      });

      await transaction.caseEvent.create({
        data: {
          caseId: id,
          action: actionDescription,
          actorName,
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: auditUserId,
          action: 'CASE_STATUS_UPDATED',
          entityType: 'Case',
          entityId: id,
          beforeValue: JSON.stringify({
            currentStatus: existingCase.currentStatus,
            proceedingNote: existingCase.proceedingNote,
          }),
          afterValue: JSON.stringify({
            currentStatus: normalizedStatus,
            proceedingNote: proceedingNote || null,
          }),
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: 'บันทึกสถานะและการดำเนินการแล้ว',
      case: {
        id: updatedCase.id,
        blackNumber: updatedCase.blackNumber,
        currentStatus: updatedCase.currentStatus,
        proceedingNote: updatedCase.proceedingNote,
        updatedAt: updatedCase.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Case status update error:', error);

    if (error?.message === 'FORBIDDEN') {
      return NextResponse.json(
        { success: false, code: 'PERMISSION_ERROR', message: 'คุณไม่มีสิทธิ์อัปเดตข้อมูลคดี' },
        { status: 403 },
      );
    }

    if (error?.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, code: 'PERMISSION_ERROR', message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, code: 'DATABASE_ERROR', message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 },
    );
  }
}
