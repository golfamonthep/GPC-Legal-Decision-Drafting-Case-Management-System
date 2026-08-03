import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  const exposeDetails = !isProduction || process.env.HEALTH_EXPOSE_DETAILS === 'true';
  let databaseConfigured = false;
  let canConnect = false;
  let detailedMessage = '';
  let host = 'unknown';
  let diagnosticCode = 'UNKNOWN';

  if (!url) {
    detailedMessage = 'DATABASE_URL or POSTGRES_URL is missing';
    diagnosticCode = 'DATABASE_URL_MISSING';
  } else if (isProduction && (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('@base'))) {
    detailedMessage = 'DATABASE_URL points to an invalid production host';
    diagnosticCode = 'DATABASE_URL_INVALID';
  } else {
    databaseConfigured = true;
    try {
      const parsed = new URL(url);
      host = parsed.host;
    } catch {
      host = 'invalid-url-format';
    }
  }

  if (databaseConfigured) {
    try {
      await prisma.$queryRaw`SELECT 1`;

      try {
        await prisma.user.findFirst();
        canConnect = true;
        detailedMessage = 'Database connection successful';
        diagnosticCode = 'OK';
      } catch (tableError: any) {
        canConnect = false;
        if (tableError?.code === 'P2021' || tableError?.message?.includes('does not exist')) {
          diagnosticCode = 'MIGRATION_OR_TABLE_MISSING';
          detailedMessage = 'Database connected, but expected tables are missing';
        } else {
          throw tableError;
        }
      }
    } catch (error: any) {
      canConnect = false;
      const errorMessage = String(error?.message || error);

      if (errorMessage.includes('tenant/user') && errorMessage.includes('not found')) {
        diagnosticCode = 'TENANT_OR_USER_NOT_FOUND';
        detailedMessage = 'Supabase tenant or user not found. Verify the project reference in DATABASE_URL.';
      } else if (errorMessage.includes('password authentication failed')) {
        diagnosticCode = 'DATABASE_AUTHENTICATION_FAILED';
        detailedMessage = 'Database authentication failed. Verify credentials.';
      } else if (
        error?.code === 'P1001' ||
        errorMessage.includes("Can't reach database server") ||
        errorMessage.includes('timeout')
      ) {
        diagnosticCode = 'DATABASE_UNREACHABLE';
        detailedMessage = 'Cannot reach the database server. Verify host, port, and network availability.';
      } else {
        diagnosticCode = 'DATABASE_CONNECTION_FAILED';
        detailedMessage = 'Database connection failed. Check server logs for details.';
      }
    }
  }

  const status = databaseConfigured && canConnect ? 'ok' : 'error';
  const publicMessage = status === 'ok' ? 'Database healthy' : 'Database unavailable';

  return NextResponse.json(
    {
      status,
      databaseConfigured,
      canConnect,
      diagnosticCode: exposeDetails ? diagnosticCode : status === 'ok' ? 'OK' : 'UNAVAILABLE',
      message: exposeDetails ? detailedMessage : publicMessage,
      ...(exposeDetails ? { host } : {}),
    },
    {
      status: status === 'ok' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
