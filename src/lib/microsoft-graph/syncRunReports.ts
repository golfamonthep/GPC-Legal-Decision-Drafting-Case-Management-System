import prisma from '@/lib/db';
import { Prisma } from '@/generated/prisma';
import { getMicrosoftGraphConfigStatus } from './config';

export interface DashboardReport {
  ok: boolean;
  source: string;
  metadataOnly: boolean;
  productionSyncDisabled: boolean;
  contentDownloadedCount: number;
  documentCreatedCount: number;
  ragIndexedCount: number;
  summary: {
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    blockedRuns: number;
    totalItemsSeen: number;
    totalItemsPersisted: number;
    totalSkipped: number;
    lastRunAt: string | null;
    lastStatus: string | null;
  };
  recentRuns: any[];
  warnings: string[];
  blockers: string[];
}

export async function getMicrosoftGraphSyncRunSummary(): Promise<DashboardReport> {
  const configStatus = getMicrosoftGraphConfigStatus();
  
  const report: DashboardReport = {
    ok: true,
    source: 'microsoft-graph',
    metadataOnly: true,
    productionSyncDisabled: !configStatus.enabled || process.env.NODE_ENV === 'production',
    contentDownloadedCount: 0,
    documentCreatedCount: 0,
    ragIndexedCount: 0,
    summary: {
      totalRuns: 0,
      completedRuns: 0,
      failedRuns: 0,
      blockedRuns: 0,
      totalItemsSeen: 0,
      totalItemsPersisted: 0,
      totalSkipped: 0,
      lastRunAt: null,
      lastStatus: null,
    },
    recentRuns: [],
    warnings: [],
    blockers: []
  };

  if (process.env.NODE_ENV === 'production') {
    report.blockers.push('Metadata persistence ยังไม่พร้อมใช้งานใน Production');
  }

  try {
    const totalRuns = await prisma.documentSyncRun.count({
      where: { provider: 'MICROSOFT_GRAPH' }
    });
    
    if (totalRuns === 0) {
      report.warnings.push('ยังไม่มีประวัติการทดสอบ Metadata Sync');
      return report;
    }
    
    const [completedRuns, failedRuns] = await Promise.all([
      prisma.documentSyncRun.count({ where: { provider: 'MICROSOFT_GRAPH', status: 'COMPLETED' } }),
      prisma.documentSyncRun.count({ where: { provider: 'MICROSOFT_GRAPH', status: 'FAILED' } })
    ]);

    const aggregations = await prisma.documentSyncRun.aggregate({
      where: { provider: 'MICROSOFT_GRAPH' },
      _sum: {
        totalSeen: true,
        persistedItemCount: true,
        wouldSkipCount: true,
      }
    });

    const latestRun = await prisma.documentSyncRun.findFirst({
      where: { provider: 'MICROSOFT_GRAPH' },
      orderBy: { startedAt: 'desc' }
    });

    const recentRuns = await prisma.documentSyncRun.findMany({
      where: { provider: 'MICROSOFT_GRAPH' },
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        startedAt: true,
        totalSeen: true,
        persistedItemCount: true,
        warningCount: true,
        errorSummary: true,
        dryRun: true,
      }
    });

    report.summary = {
      totalRuns,
      completedRuns,
      failedRuns,
      blockedRuns: 0,
      totalItemsSeen: aggregations._sum.totalSeen || 0,
      totalItemsPersisted: aggregations._sum.persistedItemCount || 0,
      totalSkipped: aggregations._sum.wouldSkipCount || 0,
      lastRunAt: latestRun?.startedAt.toISOString() || null,
      lastStatus: latestRun?.status || null,
    };
    
    report.recentRuns = recentRuns;
    
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      report.blockers.push('Metadata persistence ยังไม่พร้อมใช้งานใน Staging (Schema not migrated)');
      report.ok = false;
    } else {
      console.error('Error fetching Graph Sync Run Summary:', error);
      report.blockers.push('เกิดข้อผิดพลาดในการดึงข้อมูล Metadata Sync');
      report.ok = false;
    }
  }

  return report;
}
