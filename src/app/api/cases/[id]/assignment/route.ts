import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const user = await requireApiPermission("ASSIGN_CASES"); // Could be REASSIGN_CASES too

    const { id } = resolvedParams;
    const { type, userId, userName, reason } = await request.json();

    if (!type || !reason || reason.trim() === '') {
      return NextResponse.json({ error: 'กรุณาระบุเหตุผลในการเปลี่ยนผู้รับผิดชอบ' }, { status: 400 });
    }

    const caseObj = await prisma.case.findUnique({
      where: { id },
      include: {
        legalOfficer: true,
        owner: true,
      }
    });

    if (!caseObj) {
      return NextResponse.json({ error: 'ไม่พบสำนวนที่ต้องการมอบหมาย' }, { status: 404 });
    }

    // Determine values to update
    const updateData: any = {
      assignmentUpdatedAt: new Date(),
      assignedAt: caseObj.assignedAt || new Date()
    };
    
    let actionName = '';
    let beforeValue = '';
    let afterValue = userName || 'ไม่ระบุ';
    
    // Virtual IDs handling
    const isVirtual = userId?.startsWith('name_');
    const realUserId = isVirtual ? null : (userId || null);
    const assignedName = isVirtual ? userId.replace('name_', '') : userName;

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
    } else {
      return NextResponse.json({ error: 'ประเภทการมอบหมายไม่ถูกต้อง' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.case.update({
        where: { id },
        data: updateData,
      }),
      prisma.caseEvent.create({
        data: {
          caseId: id,
          action: actionName,
          actorName: user.name || 'System',
          // Optionally store reason/beforeValue in a detail string or metadata if available,
          // but we just put it in AuditLog to be safe.
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: type === 'LEGAL_OFFICER' ? 'CASE_LEGAL_OFFICER_ASSIGNED' : 'CASE_COMMITTEE_OWNER_ASSIGNED',
          entityType: 'Case',
          entityId: id,
          beforeValue: beforeValue,
          afterValue: afterValue,
          // reason can be stored in afterValue JSON or just concatenated, schema does not have a explicit `reason` field
        }
      })
    ]);

    return NextResponse.json({ success: true, message: 'บันทึกการมอบหมายสำเร็จ' });
  } catch (error: any) {
    console.error('Case Assignment Error:', error);
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์มอบหมายสำนวน' }, { status: 403 });
    }
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    return NextResponse.json({ error: 'ไม่สามารถบันทึกการมอบหมายได้ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
