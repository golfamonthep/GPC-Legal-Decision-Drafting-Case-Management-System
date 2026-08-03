import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';

export const dynamic = 'force-dynamic';

const CONFIRMATION_PHRASE = 'INITIALIZE_DATABASE';

export async function GET() {
  return NextResponse.json(
    {
      status: 'error',
      code: 'METHOD_NOT_ALLOWED',
      message: 'Database initialization is not available through GET.',
    },
    {
      status: 405,
      headers: { Allow: 'POST' },
    },
  );
}

export async function POST(request: Request) {
  try {
    await requireApiPermission('MANAGE_SYSTEM_SETTINGS');

    if (process.env.ENABLE_DATABASE_INIT_ENDPOINT !== 'true') {
      return NextResponse.json(
        {
          status: 'error',
          code: 'DATABASE_INIT_DISABLED',
          message: 'Database initialization endpoint is disabled.',
        },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    if (body?.confirmation !== CONFIRMATION_PHRASE) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'CONFIRMATION_REQUIRED',
          message: `Set confirmation to ${CONFIRMATION_PHRASE}.`,
        },
        { status: 400 },
      );
    }

    const sqlPath = path.join(process.cwd(), 'src', 'app', 'api', 'init-db', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const noCommentsSql = sql.replace(/--.*$/gm, '');
    const statements = noCommentsSql
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean);

    let executed = 0;
    const failures: Array<{ index: number; message: string }> = [];

    for (const [index, statement] of statements.entries()) {
      try {
        await prisma.$executeRawUnsafe(`${statement};`);
        executed += 1;
      } catch (error) {
        failures.push({
          index: index + 1,
          message: error instanceof Error ? error.message : 'Unknown database error',
        });
      }
    }

    return NextResponse.json(
      {
        status: failures.length === 0 ? 'success' : 'partial',
        statementsExecuted: executed,
        statementsFailed: failures.length,
        failures,
      },
      { status: failures.length === 0 ? 200 : 500 },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR';

    if (code === 'UNAUTHORIZED') {
      return NextResponse.json({ status: 'error', code }, { status: 401 });
    }
    if (code === 'FORBIDDEN') {
      return NextResponse.json({ status: 'error', code }, { status: 403 });
    }

    console.error('Init DB error:', error);
    return NextResponse.json(
      {
        status: 'error',
        code: 'DATABASE_INIT_FAILED',
        message: 'Failed to initialize database.',
      },
      { status: 500 },
    );
  }
}
