import { NextResponse } from 'next/server';
import { checkGraphIntegrationStatus } from '@/lib/microsoft/graphConfig';

export async function GET() {
  try {
    const status = checkGraphIntegrationStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      {
        isConfigured: false,
        missingKeys: [],
        mode: 'disabled',
        message: 'ไม่สามารถตรวจสอบสถานะ Microsoft Integration ได้',
      },
      { status: 500 }
    );
  }
}
