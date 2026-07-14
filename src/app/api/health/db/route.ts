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
  let diagnosticCode = 'UNKNOWN';
  
  if (!url) {
    message = 'DATABASE_URL or POSTGRES_URL is missing';
    diagnosticCode = 'DATABASE_URL_MISSING';
  } else if (isProduction && (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('@base'))) {
    message = 'DATABASE_URL points to localhost, 127.0.0.1, or base in production environment';
    diagnosticCode = 'DATABASE_URL_MISSING';
  } else {
    databaseConfigured = true;
    try {
      const parsed = new URL(url);
      host = parsed.host;
    } catch (e) {
      host = 'invalid-url-format';
    }
  }

  if (databaseConfigured) {
    try {
      // 1. Test basic connectivity
      await prisma.$queryRaw`SELECT 1`;
      
      // 2. Test if tables exist
      try {
        await prisma.user.findFirst();
        canConnect = true;
        message = 'Database connection successful';
        diagnosticCode = 'OK';
      } catch (tableError: any) {
        canConnect = false;
        // P2021 is the Prisma code for "Table does not exist"
        if (tableError?.code === 'P2021' || tableError?.message?.includes('does not exist')) {
            diagnosticCode = 'MIGRATION_OR_TABLE_MISSING';
            message = 'Database connected, but expected tables are missing (migrations not applied)';
        } else {
            throw tableError;
        }
      }
    } catch (error: any) {
      canConnect = false;
      const errorMsg = String(error?.message || error);
      
      // Map error messages to safe diagnostic codes without exposing secrets or raw URLs
      if (errorMsg.includes('tenant/user') && errorMsg.includes('not found')) {
        diagnosticCode = 'TENANT_OR_USER_NOT_FOUND';
        message = 'Supabase tenant or user not found. Verify the PROJECT_REF in the DATABASE_URL username.';
      } else if (errorMsg.includes('password authentication failed')) {
        diagnosticCode = 'DATABASE_CONNECTION_FAILED';
        message = 'Authentication failed. Verify database credentials.';
      } else if (error?.code === 'P1001' || errorMsg.includes('Can\'t reach database server') || errorMsg.includes('timeout')) {
        diagnosticCode = 'DATABASE_CONNECTION_FAILED';
        message = 'Cannot reach the database server. Verify host, port, and network availability.';
      } else {
        diagnosticCode = 'DATABASE_CONNECTION_FAILED';
        message = 'Database connection failed. Check server logs for details.';
      }
    }
  }

  const status = databaseConfigured && canConnect ? 'ok' : 'error';

  return NextResponse.json({
    status,
    databaseConfigured,
    canConnect,
    host,
    diagnosticCode,
    message,
  }, { status: status === 'ok' ? 200 : 500 });
}
