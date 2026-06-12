import { NextRequest, NextResponse } from 'next/server';
import { auditLog } from '@/lib/audit';
import { checkGraphIntegrationStatus } from '@/lib/microsoft/graphConfig';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const caseId = resolvedParams.id;

    const status = checkGraphIntegrationStatus();
    
    if (!status.isConfigured) {
      await auditLog({
        action: 'CASE_DOCUMENT_UPLOAD_BLOCKED_CONFIG_MISSING',
        entityType: 'Case',
        entityId: caseId,
      });

      return NextResponse.json(
        { error: 'ยังไม่ได้ตั้งค่า Microsoft Graph สำหรับจัดเก็บไฟล์' },
        { status: 501 } // 501 Not Implemented
      );
    }

    await auditLog({
      action: 'CASE_DOCUMENT_UPLOAD_REQUESTED',
      entityType: 'Case',
      entityId: caseId,
    });

    return NextResponse.json(
      { error: 'ระบบยังไม่เปิดใช้งานการอัปโหลดไฟล์ไปยัง OneDrive/SharePoint' },
      { status: 501 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
