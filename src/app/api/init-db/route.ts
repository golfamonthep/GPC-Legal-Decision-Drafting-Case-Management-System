import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sqlPath = path.join(process.cwd(), 'src', 'app', 'api', 'init-db', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Remove comments
    const noCommentsSql = sql.replace(/--.*$/gm, '');
    
    // Split SQL by semicolon and execute each statement
    const statements = noCommentsSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let executed = 0;
    for (const statement of statements) {
      if (statement) {
        try {
          await prisma.$executeRawUnsafe(statement + ';');
          executed++;
        } catch (stmtError: any) {
          console.warn('Statement failed, continuing:', stmtError.message);
        }
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
