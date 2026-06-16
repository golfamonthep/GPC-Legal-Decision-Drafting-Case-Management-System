// src/lib/admin/adminMetrics.ts
// Aggregates read‑only metrics for the admin console.
// No secrets are exposed; all values are primitive counts or booleans.

import prisma from '@/lib/db';
import { auditLog } from '@/lib/audit';

export type AdminMetrics = {
  // Auth / user
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  disabledUsers: number;
  adminCount: number;
  usersWithoutRole: number;

  // Cases / documents
  totalCases: number;
  activeCases: number;
  completedCases: number;
  archivedCases: number;
  draftCount: number;
  totalDocuments: number;
  totalDocumentChunks: number;
  ingestionJobs: number;
  auditLogCount: number;

  // AI / RAG
  aiQueryCount: number;
  aiFailureCount: number;
  ragIngestionJobsByStatus: Record<string, number>;
  recentFailedIngestionJobs: number;

  // Integration readiness (booleans only)
  openAiConfigured: boolean;
  microsoftGraphConfigured: boolean;
};

/** Helper to check env presence without leaking values */
function isConfigured(varName: string): boolean {
  return typeof process.env[varName] !== 'undefined' && process.env[varName] !== '';
}

export async function getAdminMetrics(userId: string): Promise<AdminMetrics> {
  // 1️⃣ Users
  const [totalUsers, activeUsers, pendingUsers, disabledUsers, adminCount, usersWithoutRole] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { status: 'DISABLED' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: '' } }),
  ]);

  // 2️⃣ Cases & documents – use lightweight aggregates
  const [totalCases, activeCases, completedCases, archivedCases, draftCount, totalDocuments, totalDocumentChunks, ingestionJobs, auditLogCount] = await prisma.$transaction([
    prisma.case.count(),
    prisma.case.count({ where: { currentStatus: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.case.count({ where: { currentStatus: 'COMPLETED' } }),
    prisma.caseArchiveRecord.count(),
    prisma.decisionDraft.count(),
    prisma.caseDocument.count(),
    prisma.documentChunk.count(),
    prisma.documentIngestionJob.count(),
    prisma.auditLog.count(),
  ]);

  // 3️⃣ AI / RAG metrics
  const [aiQueryCount, aiFailureCount] = await prisma.$transaction([
    prisma.aiQueryLog.count(),
    prisma.aiQueryLog.count({ where: { response: '' } }), // simplistic failure detection
  ]);

  // groupBy cannot be used inside $transaction in Prisma v7; orderBy is required
  const ragJobs = await prisma.documentIngestionJob.groupBy({
    by: ['status'],
    _count: { _all: true },
    orderBy: { status: 'asc' },
  });

  const ragIngestionJobsByStatus: Record<string, number> = {};
  ragJobs.forEach((g) => {
    ragIngestionJobsByStatus[g.status] = Number(g._count._all);
  });

  const recentFailedIngestionJobs = await prisma.documentIngestionJob.count({
    where: { status: 'failed', updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  });

  // 4️⃣ Integration readiness booleans
  const openAiConfigured = isConfigured('OPENAI_API_KEY');
  const microsoftGraphConfigured = isConfigured('MICROSOFT_TENANT_ID') && isConfigured('MICROSOFT_CLIENT_ID');

  return {
    totalUsers,
    activeUsers,
    pendingUsers,
    disabledUsers,
    adminCount,
    usersWithoutRole,
    totalCases,
    activeCases,
    completedCases,
    archivedCases,
    draftCount,
    totalDocuments,
    totalDocumentChunks,
    ingestionJobs,
    auditLogCount,
    aiQueryCount,
    aiFailureCount,
    ragIngestionJobsByStatus,
    recentFailedIngestionJobs,
    openAiConfigured,
    microsoftGraphConfigured,
  };
}
