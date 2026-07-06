import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { listQuarantineItemsForReview, updateQuarantineReviewStatus } from '@/lib/microsoft-graph/contentQuarantine';

export async function GET(req: Request) {
  try {
    // Requires specific audit view permission or general sync view
    const user = await requireApiPermission('VIEW_DOCUMENT_SYNC');
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    
    const result = await listQuarantineItemsForReview({ status });
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Require elevated permission for mutation
    const user = await requireApiPermission('MANAGE_DOCUMENT_SYNC');

    // Staging only mutation check
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Quarantine mutations are disabled in production.' }, { status: 423 });
    }

    const body = await req.json().catch(() => ({}));
    
    if (!body.itemId || !body.newStatus || !body.reviewNotes) {
      return NextResponse.json({ error: 'Missing required fields: itemId, newStatus, reviewNotes.' }, { status: 400 });
    }

    // Ensure we don't approve for production
    if (body.newStatus === 'APPROVED_FOR_PRODUCTION') {
        return NextResponse.json({ error: 'Cannot approve for production from staging quarantine.' }, { status: 403 });
    }

    const result = await updateQuarantineReviewStatus({
      itemId: body.itemId,
      newStatus: body.newStatus,
      reviewNotes: body.reviewNotes,
    }, { id: user.id });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 400 }); // Status 400 for validation errors
  }
}
