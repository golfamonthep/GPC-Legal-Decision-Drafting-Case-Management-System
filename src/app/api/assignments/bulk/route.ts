import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import prisma from '@/lib/db';
import { isClosedOrRedCase } from '@/lib/caseStatus';

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiPermission("ASSIGN_CASES");

    const { caseIds, type, userId, userName, reason, includeCompleted } = await request.json();

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json({ error: 'ไม่พบสำนวนที่ต้องการมอบหมาย' }, { status: 400 });
    }

    if (!type || !reason || reason.trim() === '') {
      return NextResponse.json({ error: 'กรุณาระบุเหตุผลในการเปลี่ยนผู้รับผิดชอบ' }, { status: 400 });
    }

    const cases = await prisma.case.findMany({
      where: { id: { in: caseIds } },
      include: { owner: true, legalOfficer: true }
    });

    let assignedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const isVirtual = userId?.startsWith('name_');
    const realUserId = isVirtual ? null : (userId || null);
    const assignedName = isVirtual ? userId.replace('name_', '') : userName;

    for (const caseObj of cases) {
      if (!includeCompleted && isClosedOrRedCase(caseObj)) {
        skippedCount++;
        continue;
      }

      try {
        const updateData: any = {
          assignmentUpdatedAt: new Date(),
          assignedAt: caseObj.assignedAt || new Date()
        };
        
        let actionName = '';
        let beforeValue = '';
        let afterValue = userName || 'ไม่ระบุ';

        if (type === 'LEGAL_OFFICER') {
          beforeValue = caseObj.legalOfficerName || 'ไม่มี';
          updateData.legalOfficerId = realUserId;
          updateData.legalOfficerName = assignedName;
          actionName = caseObj.legalOfficerId || caseObj.legalOfficerName ? 'เปลี่ยนนิติกร' : 'มอบหมายนิติกร';
        } else if (type === 'COMMITTEE_OWNER') {
          beforeValue = caseObj.committeeOwnerName || (caseObj.owner ? caseObj.owner.name : 'ไม่มี') || 'ไม่มี';
          updateData.ownerId = realUserId;
          updateData.committeeOwnerName = assignedName;
          actionName = caseObj.ownerId || caseObj.committeeOwnerName ? 'เปลี่ยนกรรมการเจ้าของสำนวน' : 'มอบหมายกรรมการเจ้าของสำนวน';
        }

        await prisma.$transaction([
          prisma.case.update({
            where: { id: caseObj.id },
            data: updateData,
          }),
          prisma.caseEvent.create({
            data: {
              caseId: caseObj.id,
              action: actionName,
              actorName: user.name || 'System'
            }
          }),
          prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'CASE_ASSIGNMENT_BULK_UPDATED',
              entityType: 'Case',
              entityId: caseObj.id,
              beforeValue: beforeValue,
              afterValue: JSON.stringify({ assignedName, reason }),
            }
          })
        ]);
        
        assignedCount++;
      } catch (err) {
        console.error(`Failed to assign case ${caseObj.id}`, err);
        failedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      assignedCount, 
      skippedCount, 
      failedCount,
      message: `มอบหมายสำเร็จ ${assignedCount} คดี, ข้าม ${skippedCount} คดี, ล้มเหลว ${failedCount} คดี` 
    });
  } catch (error: any) {
    console.error('Bulk Assignment Error:', error);
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์มอบหมายสำนวน' }, { status: 403 });
    }
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    return NextResponse.json({ error: 'ไม่สามารถบันทึกการมอบหมายได้ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
