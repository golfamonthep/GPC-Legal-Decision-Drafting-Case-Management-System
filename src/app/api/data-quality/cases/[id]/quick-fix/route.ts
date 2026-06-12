import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const user = await requireApiPermission('CLEANUP_DATA_QUALITY');
    if (!user) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์เข้าถึงในการแก้ไขข้อมูล' }, { status: 403 });
    }

    const { id } = resolvedParams;
    const body = await request.json();
    const { field, value } = body;

    const caseData = await prisma.case.findUnique({
      where: { id: resolvedParams.id },
      include: { legalOfficer: true }
    });

    if (!caseData) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลสำนวน' }, { status: 404 });
    }

    const allowedFields = [
      'redNumber', 
      'petitionerName', 
      'respondentName', 
      'subject', 
      'currentStatus', 
      'receivedDate',
      'legalOfficerId',
      'ownerId'
    ];

    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: 'ไม่อนุญาตให้แก้ไขฟิลด์นี้' }, { status: 400 });
    }

    const updateData: any = {};
    
    // Type handling
    if (field === 'receivedDate') {
      updateData[field] = value ? new Date(value) : null;
    } else if (field === 'legalOfficerId') {
      updateData.legalOfficerId = value;
      if (value) {
        const lo = await prisma.user.findUnique({ where: { id: value } });
        if (lo) updateData.legalOfficerName = lo.name;
      } else {
        updateData.legalOfficerName = null;
      }
    } else {
      updateData[field] = value;
    }

    const updatedCase = await prisma.$transaction(async (tx) => {
      const updated = await tx.case.update({
        where: { id: resolvedParams.id },
        data: updateData
      });

      const beforeValue = String((caseData as any)[field] ?? '');
      const afterValue = String(updateData[field] ?? '');

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DATA_QUALITY_QUICK_FIX_APPLIED',
          entityType: 'Case',
          entityId: resolvedParams.id,
          beforeValue: `${field}: ${beforeValue}`,
          afterValue: `${field}: ${afterValue}`,
        }
      });

      if (field === 'currentStatus' || field === 'legalOfficerId' || field === 'ownerId') {
        await tx.caseEvent.create({
          data: {
            caseId: id,
            action: `แก้ไข ${field} (Data Quality Quick Fix)`,
            actorName: user.name || 'Unknown',
          }
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, updatedCase });

  } catch (error: any) {
    console.error('Error applying quick fix:', error);
    return NextResponse.json({ error: 'ไม่สามารถแก้ไขข้อมูลได้ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
