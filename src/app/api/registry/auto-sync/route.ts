import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { syncSnapshotToDatabase, getSnapshotMetadata } from '@/lib/registry/dbSync';
import { setInMemorySnapshotOverride } from '@/lib/registry/caseSnapshot';

export const dynamic = 'force-dynamic';

const DEFAULT_SYNC_TOKEN = process.env.GPC_SYNC_KEY || 'gpc-registry-autosync-2569-v1';

export async function GET() {
  try {
    const result = await syncSnapshotToDatabase(prisma);
    const meta = getSnapshotMetadata();
    try {
      revalidatePath('/cases');
      revalidatePath('/registry');
      revalidatePath('/dashboard');
    } catch {}

    const isSnapshotReady = (meta.summary?.total || 0) > 0;
    return NextResponse.json(
      {
        ...result,
        success: result.success || isSnapshotReady,
        dbSynced: result.success,
        snapshotUpdatedAt: meta.updatedAt,
        summary: meta.summary,
        recentChangesCount: meta.recentChanges.length,
      },
      { status: result.success || isSnapshotReady ? 200 : 500 }
    );
  } catch (error: any) {
    console.error('[API AutoSync] GET Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Auto-sync failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let customCases: any[] | undefined = undefined;
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await request.json().catch(() => null);
        const token = request.headers.get('x-gpc-sync-key') || body?.syncKey;
        if (body && token === DEFAULT_SYNC_TOKEN) {
          if (body.snapshot && Array.isArray(body.snapshot.cases)) {
            setInMemorySnapshotOverride(body.snapshot);
            customCases = body.snapshot.cases;
          } else if (Array.isArray(body.cases) && body.cases.length > 0) {
            customCases = body.cases;
          }
        }
      }
    } catch {}

    const result = await syncSnapshotToDatabase(prisma, customCases);
    const meta = getSnapshotMetadata();
    try {
      revalidatePath('/cases');
      revalidatePath('/registry');
      revalidatePath('/dashboard');
    } catch {}

    const isSnapshotReady = (meta.summary?.total || 0) > 0;
    return NextResponse.json(
      {
        ...result,
        success: result.success || isSnapshotReady,
        dbSynced: result.success,
        snapshotUpdatedAt: meta.updatedAt,
        summary: meta.summary,
        recentChangesCount: meta.recentChanges.length,
      },
      { status: result.success || isSnapshotReady ? 200 : 500 }
    );
  } catch (error: any) {
    console.error('[API AutoSync] POST Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Auto-sync failed' },
      { status: 500 }
    );
  }
}
