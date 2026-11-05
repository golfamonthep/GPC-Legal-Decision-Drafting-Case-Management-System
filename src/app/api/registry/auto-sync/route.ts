import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { syncSnapshotToDatabase } from '@/lib/registry/dbSync';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const result = await syncSnapshotToDatabase(prisma);
    try {
      revalidatePath('/cases');
      revalidatePath('/registry');
      revalidatePath('/dashboard');
    } catch {}

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
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
    const result = await syncSnapshotToDatabase(prisma);
    try {
      revalidatePath('/cases');
      revalidatePath('/registry');
      revalidatePath('/dashboard');
    } catch {}

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    console.error('[API AutoSync] POST Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Auto-sync failed' },
      { status: 500 }
    );
  }
}
