import { NextRequest, NextResponse } from 'next/server';
import { listCaseDocuments, linkExternalDocumentToCase } from '@/lib/documents/documentStorage';
import { auditLog } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    }, 'mock-user-id'); // TODO: get from auth session

    return NextResponse.json(document);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
