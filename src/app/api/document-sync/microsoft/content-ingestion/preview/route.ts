import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { runContentIngestionPreview } from '@/lib/microsoft-graph/contentIngestionPrototype';
import { buildQuarantineItemsFromPrototypeResult } from '@/lib/microsoft-graph/contentQuarantine';

export async function POST(req: Request) {
  try {
    const user = await requireApiPermission('VIEW_DOCUMENT_SYNC');

    const result = await runContentIngestionPreview();
    const previewQuarantineItems = await buildQuarantineItemsFromPrototypeResult(result.quarantineCandidates);

    return NextResponse.json({
      success: true,
      message: 'Preview generated successfully',
      data: {
        totalSeen: result.totalSeen,
        wouldIngest: result.wouldIngest,
        wouldQuarantine: result.wouldQuarantine,
        quarantinePreview: previewQuarantineItems,
      }
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
