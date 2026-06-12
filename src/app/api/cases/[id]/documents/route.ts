import { NextRequest, NextResponse } from 'next/server';
import { listCaseDocuments, linkExternalDocumentToCase } from '@/lib/documents/documentStorage';
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import { auditLog } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission("VIEW_DOCUMENTS");
    const resolvedParams = await params;
    const caseId = resolvedParams.id;
    const documents = await listCaseDocuments(caseId);

    // Audit log
    await auditLog({
      action: 'CASE_DOCUMENT_LIST_VIEWED',
      entityType: 'Case',
      entityId: caseId,
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error("GET Documents Error:", error);
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ดำเนินการนี้" }, { status: 403 });
    }
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }
    return NextResponse.json({ error: 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiPermission("LINK_DOCUMENTS");
    const resolvedParams = await params;
    const caseId = resolvedParams.id;
    const body = await req.json();

    const { title, webUrl, documentCategory, notes } = body;

    if (!title || !webUrl || !documentCategory) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const document = await linkExternalDocumentToCase(caseId, {
      title,
      webUrl,
      documentCategory,
      notes
    }, user.id);

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("POST Link Document Error:", error);
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ดำเนินการนี้" }, { status: 403 });
    }
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }
    return NextResponse.json({ error: 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง' }, { status: 400 });
  }
}
