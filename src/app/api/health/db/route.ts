import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  let databaseConfigured = false;
  let canConnect = false;
  let message = '';
  let host = 'unknown';
  
  if (!url) {
    message = 'DATABASE_URL or POSTGRES_URL is missing';
  } else if (isProduction && (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('@base'))) {
    message = 'DATABASE_URL points to localhost, 127.0.0.1, or base in production environment';
  } else {
    databaseConfigured = true;
    try {
      // Safely parse host
      if (url.startsWith('prisma+postgres://')) {
         // It's a prisma accelerate or local prisma server URL
         const parsed = new URL(url);
         host = parsed.host;
      } else {
         const parsed = new URL(url);
         host = parsed.host;
      }
    } catch (e) {
      host = 'invalid-url-format';
    }
  }

  if (databaseConfigured) {
    try {
      // Lightweight Prisma query
      await prisma.$queryRaw`SELECT 1`;
      canConnect = true;
      message = 'Database connection successful';
    } catch (error: any) {
      canConnect = false;
      message = `Database connection failed: ${error.message}`;
    }
  }

  const status = databaseConfigured && canConnect ? 'ok' : 'error';

  return NextResponse.json({
    status,
    databaseConfigured,
    canConnect,
    host,
    message,
  }, { status: status === 'ok' ? 200 : 500 });
}
