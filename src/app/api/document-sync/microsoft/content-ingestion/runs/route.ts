import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { listContentIngestionRuns } from '@/lib/microsoft-graph/contentIngestionPrototype';

export async function GET(req: Request) {
  try {
    const user = await requireApiPermission('VIEW_DOCUMENT_SYNC');
    const result = await listContentIngestionRuns();
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
