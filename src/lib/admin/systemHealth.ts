// src/lib/admin/systemHealth.ts
// Provides a lightweight, read‑only health overview for the admin console.
// Never returns secret values – only booleans / simple strings.

import prisma from '@/lib/db';
import { auditLog } from '@/lib/audit';

export type Alert = {
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
};

export type SystemHealth = {
  dbConnected: boolean;
  prismaReady: boolean;
  environment: string;
  config: {
    DATABASE_URL: boolean;
    DIRECT_URL: boolean;
    OPENAI_API_KEY: boolean;
    EMBEDDING_MODEL: boolean;
    AUTH_SECRET: boolean;
    AUTH_URL: boolean;
    MICROSOFT_TENANT_ID: boolean;
    MICROSOFT_CLIENT_ID: boolean;
    VERCEL_ENV: boolean;
    FIRST_ADMIN_BOOTSTRAP: boolean;
  };
  alerts: Alert[];
};

/**
 * Checks a set of env vars for presence without revealing their values.
 */
function checkEnv(varName: string): boolean {
  return typeof process.env[varName] !== 'undefined' && process.env[varName] !== '';
}

/**
 * Main health check – safe for production.
 */
export async function getSystemHealth(userId: string): Promise<SystemHealth> {
  const alerts: Alert[] = [];

  // 1️⃣ DB connectivity (lightweight SELECT 1)
  let dbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (e) {
    alerts.push({ level: 'CRITICAL', message: 'DB connection failed' });
  }

  // 2️⃣ Prisma readiness – if we can import the client we assume it's ready.
  const prismaReady = !!prisma;

  // 3️⃣ Environment name – we expose only "development", "staging" or "production"
  const environment = process.env.NODE_ENV ?? 'unknown';

  // 4️⃣ Config presence checks (no values leaked)
  const config = {
    DATABASE_URL: checkEnv('DATABASE_URL'),
    DIRECT_URL: checkEnv('DIRECT_URL'),
    OPENAI_API_KEY: checkEnv('OPENAI_API_KEY'),
    EMBEDDING_MODEL: checkEnv('EMBEDDING_MODEL'),
    AUTH_SECRET: checkEnv('AUTH_SECRET'),
    AUTH_URL: checkEnv('AUTH_URL'),
    MICROSOFT_TENANT_ID: checkEnv('MICROSOFT_TENANT_ID'),
    MICROSOFT_CLIENT_ID: checkEnv('MICROSOFT_CLIENT_ID'),
    VERCEL_ENV: checkEnv('VERCEL_ENV'),
    FIRST_ADMIN_BOOTSTRAP: checkEnv('FIRST_ADMIN_BOOTSTRAP'),
  };

  // 5️⃣ Deterministic alerts based on config
  if (!config.OPENAI_API_KEY) {
    alerts.push({ level: 'WARNING', message: 'OpenAI not configured' });
  }
  if (!config.MICROSOFT_TENANT_ID || !config.MICROSOFT_CLIENT_ID) {
    alerts.push({ level: 'WARNING', message: 'Microsoft Graph not configured' });
  }
  if (config.FIRST_ADMIN_BOOTSTRAP) {
    alerts.push({ level: 'CRITICAL', message: 'First‑admin bootstrap flag enabled' });
  }

  return { dbConnected, prismaReady, environment, config, alerts };
}
