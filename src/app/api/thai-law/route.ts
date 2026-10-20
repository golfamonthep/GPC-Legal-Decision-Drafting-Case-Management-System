import { NextRequest, NextResponse } from 'next/server';
import { searchPoliceLaws } from '@/lib/thai-law/search';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'ทั้งหมด';
  const actId = searchParams.get('actId') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  try {
    const result = searchPoliceLaws({
      q,
      category,
      actId,
      page: Math.max(1, page),
      pageSize: Math.min(100, Math.max(1, pageSize))
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error searching police laws:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
