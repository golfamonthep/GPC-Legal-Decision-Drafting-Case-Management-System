import prisma from '@/lib/db';
import { isClosedOrRedCase } from '@/lib/caseStatus';

// Thresholds for workload warnings
export const HIGH_ACTIVE_WORKLOAD_THRESHOLD = 20;
export const HIGH_OVERDUE_THRESHOLD = 5;
export const NEAR_DUE_DAYS = 15;

export interface WorkloadStats {
  userId: string;
  name: string;
  role: string;
  totalCases: number;
  activeCases: number;
  overdueCases: number;
  completedCases: number;
  nearDueCases: number;
  noRedNumber: number;
}

export async function getAssignableUsers() {
  return prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'COMMISSIONER', 'LEGAL_OFFICER', 'REGISTRY_OFFICER']
      },
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
    orderBy: {
      name: 'asc'
    }
  });
}

function calculateDaysUntilDue(dueDate: Date | null | undefined): number | undefined {
  if (!dueDate) return undefined;
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function calculateWorkload(): Promise<{
  legalOfficers: WorkloadStats[];
  committeeOwners: WorkloadStats[];
  unassignedLegalOfficerCases: number;
  unassignedCommitteeOwnerCases: number;
  totalActiveCases: number;
  totalOverdueCases: number;
}> {
  const users = await getAssignableUsers();
  const allCases = await prisma.case.findMany({
    select: {
      id: true,
      legalOfficerId: true,
      legalOfficerName: true,
      ownerId: true,
      committeeOwnerName: true,
      status: true,
      currentStatus: true,
      redNumber: true,
      dueDate30: true,
      dueDate60: true,
      dueDate90: true,
      dueDate120: true,
      dueDate240: true,
    } as any // using any to bypass strict type check for now since schema might not be fully synced in types
  });

  const legalOfficersMap = new Map<string, WorkloadStats>();
  const committeeOwnersMap = new Map<string, WorkloadStats>();

  // Initialize maps for legal officers and commissioners based on user role
  users.forEach(user => {
    if (['ADMIN', 'LEGAL_OFFICER'].includes(user.role)) {
      legalOfficersMap.set(user.id, {
        userId: user.id, name: user.name, role: user.role, totalCases: 0, activeCases: 0, overdueCases: 0, completedCases: 0, nearDueCases: 0, noRedNumber: 0
      });
    }
    if (['ADMIN', 'COMMISSIONER'].includes(user.role)) {
      committeeOwnersMap.set(user.id, {
        userId: user.id, name: user.name, role: user.role, totalCases: 0, activeCases: 0, overdueCases: 0, completedCases: 0, nearDueCases: 0, noRedNumber: 0
      });
    }
  });

  let unassignedLegalOfficerCases = 0;
  let unassignedCommitteeOwnerCases = 0;
  let totalActiveCases = 0;
  let totalOverdueCases = 0;

  allCases.forEach((c: any) => {
    const isClosed = isClosedOrRedCase(c);
    const dueDate = c.dueDate30 || c.dueDate60 || c.dueDate90 || c.dueDate120 || c.dueDate240;
    const daysUntilDue = calculateDaysUntilDue(dueDate);
    const isOverdue = daysUntilDue !== undefined && daysUntilDue < 0 && !isClosed;
    const isNearDue = daysUntilDue !== undefined && daysUntilDue >= 0 && daysUntilDue <= NEAR_DUE_DAYS && !isClosed;
    const hasRedNum = !!c.redNumber && c.redNumber.trim() !== '' && c.redNumber.trim() !== '-';

    if (!isClosed) totalActiveCases++;
    if (isOverdue) totalOverdueCases++;

    // Process Legal Officer Workload
    const loId = c.legalOfficerId;
    const loName = c.legalOfficerName;

    if (loId && legalOfficersMap.has(loId)) {
      const stats = legalOfficersMap.get(loId)!;
      stats.totalCases++;
      if (!isClosed) stats.activeCases++;
      else stats.completedCases++;
      if (isOverdue) stats.overdueCases++;
      if (isNearDue) stats.nearDueCases++;
      if (!hasRedNum && !isClosed) stats.noRedNumber++;
    } else if (!loId && loName && loName.trim() !== '') {
      // Dynamic entry for imported names without user relation
      const virtualId = `name_${loName}`;
      if (!legalOfficersMap.has(virtualId)) {
        legalOfficersMap.set(virtualId, {
          userId: virtualId, name: `${loName} (ชื่อจากทะเบียน)`, role: 'IMPORTED', totalCases: 0, activeCases: 0, overdueCases: 0, completedCases: 0, nearDueCases: 0, noRedNumber: 0
        });
      }
      const stats = legalOfficersMap.get(virtualId)!;
      stats.totalCases++;
      if (!isClosed) stats.activeCases++;
      else stats.completedCases++;
      if (isOverdue) stats.overdueCases++;
      if (isNearDue) stats.nearDueCases++;
      if (!hasRedNum && !isClosed) stats.noRedNumber++;
    } else {
      if (!isClosed) unassignedLegalOfficerCases++;
    }

    // Process Committee Owner Workload
    const coId = c.ownerId;
    const coName = c.committeeOwnerName;

    if (coId && committeeOwnersMap.has(coId)) {
      const stats = committeeOwnersMap.get(coId)!;
      stats.totalCases++;
      if (!isClosed) stats.activeCases++;
      else stats.completedCases++;
      if (isOverdue) stats.overdueCases++;
      if (isNearDue) stats.nearDueCases++;
      if (!hasRedNum && !isClosed) stats.noRedNumber++;
    } else if (!coId && coName && coName.trim() !== '') {
      const virtualId = `name_${coName}`;
      if (!committeeOwnersMap.has(virtualId)) {
        committeeOwnersMap.set(virtualId, {
          userId: virtualId, name: `${coName} (ชื่อจากทะเบียน)`, role: 'IMPORTED', totalCases: 0, activeCases: 0, overdueCases: 0, completedCases: 0, nearDueCases: 0, noRedNumber: 0
        });
      }
      const stats = committeeOwnersMap.get(virtualId)!;
      stats.totalCases++;
      if (!isClosed) stats.activeCases++;
      else stats.completedCases++;
      if (isOverdue) stats.overdueCases++;
      if (isNearDue) stats.nearDueCases++;
      if (!hasRedNum && !isClosed) stats.noRedNumber++;
    } else {
      if (!isClosed) unassignedCommitteeOwnerCases++;
    }
  });

  return {
    legalOfficers: Array.from(legalOfficersMap.values()).filter(s => s.totalCases > 0 || s.role !== 'IMPORTED').sort((a, b) => b.activeCases - a.activeCases),
    committeeOwners: Array.from(committeeOwnersMap.values()).filter(s => s.totalCases > 0 || s.role !== 'IMPORTED').sort((a, b) => b.activeCases - a.activeCases),
    unassignedLegalOfficerCases,
    unassignedCommitteeOwnerCases,
    totalActiveCases,
    totalOverdueCases
  };
}
