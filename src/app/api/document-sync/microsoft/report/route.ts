import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { getMicrosoftGraphSyncRunSummary } from '@/lib/microsoft-graph/syncRunReports';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    // Require viewing permission. Using VIEW_DOCUMENT_SYNC as it's the safest general sync view permission.
    await requireApiPermission('VIEW_DOCUMENT_SYNC');

    const report = await getMicrosoftGraphSyncRunSummary();
    
    return NextResponse.json(report, { status: 200 });

  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (err.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    console.error('Error in Microsoft Graph sync report route:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
