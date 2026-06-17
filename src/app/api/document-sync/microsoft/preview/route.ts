import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { listMockGraphDocuments } from '@/lib/microsoft-graph/mock';

export async function POST() {
  try {
    await requireApiPermission('PREVIEW_DOCUMENT_SYNC');

    // No live Graph call, no DB mutation.
    const previewResult = await listMockGraphDocuments();

    return NextResponse.json(previewResult);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('[Microsoft Graph Preview API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
