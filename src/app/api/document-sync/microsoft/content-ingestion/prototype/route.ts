import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { runContentIngestionPrototype } from '@/lib/microsoft-graph/contentIngestionPrototype';

export async function POST(req: Request) {
  try {
    const user = await requireApiPermission('MANAGE_DOCUMENT_SYNC');

    // Production is explicitly blocked
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MICROSOFT_GRAPH_CONTENT_INGESTION_PROTOTYPE !== 'YES') {
      return NextResponse.json({ error: 'Prototype execution is disabled in this environment.' }, { status: 423 });
    }

    const body = await req.json().catch(() => ({}));

    // Must require classification and confirmation phrase
    if (!body.confirmationPhrase || body.confirmationPhrase !== 'CONFIRM_STAGING_PROTOTYPE') {
      return NextResponse.json({ error: 'Missing or invalid confirmation phrase.' }, { status: 400 });
    }

    if (!body.classification) {
      return NextResponse.json({ error: 'Classification is required.' }, { status: 400 });
    }

    const result = await runContentIngestionPrototype(body, user);
    
    // Result will be false/blocked because prototype is blocked
    if (!result.success) {
       return NextResponse.json(result, { status: 423 }); // Locked/Blocked
    }

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
