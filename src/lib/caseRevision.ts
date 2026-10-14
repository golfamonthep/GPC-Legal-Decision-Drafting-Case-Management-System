import 'server-only';

import prisma from '@/lib/db';
import { isDemoDashboardModeAllowed } from '@/lib/dashboard/data';

export async function getCaseRevision(): Promise<string> {
  if (isDemoDashboardModeAllowed()) return 'demo';
  const summary = await prisma.case.aggregate({ _count: { id: true }, _max: { updatedAt: true } });
  return `${summary._count.id}:${summary._max.updatedAt?.toISOString() || ''}`;
}
