import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { getMicrosoftGraphConfigStatus } from '@/lib/microsoft-graph/config';

export async function GET() {
  try {
    await requireApiPermission('VIEW_DOCUMENT_SYNC');

    const status = getMicrosoftGraphConfigStatus();

    // Ensure we do NOT return any secrets, only the safe status object
    return NextResponse.json({
      configured: status.configured,
      enabled: status.enabled,
      missingKeys: status.missingKeys, // Safe key names only
      liveSyncAvailable: false, // Hardcoded to false for this prompt
      message: status.message,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('[Microsoft Graph Status API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
