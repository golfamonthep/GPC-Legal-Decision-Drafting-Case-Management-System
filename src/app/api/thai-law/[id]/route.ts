import { NextRequest, NextResponse } from 'next/server';
import { getSectionById } from '@/lib/thai-law/search';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detail = getSectionById(id);

    if (!detail.section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error: any) {
    console.error('Error fetching section by id:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
