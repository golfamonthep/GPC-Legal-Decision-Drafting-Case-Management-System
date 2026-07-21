import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sqlPath = path.join(process.cwd(), 'src', 'app', 'api', 'init-db', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    let executed = 0;
    for (const statement of statements) {
      if (statement) {
        await prisma.$executeRawUnsafe(statement + ';');
        executed++;
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database initialized successfully',
      statementsExecuted: executed,
    });
  } catch (error: any) {
    console.error('Init DB error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to initialize database',
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
