import prisma from '@/lib/db';
import { Prisma } from '@/generated/prisma';
import { getHydratedSnapshotCases } from '@/lib/registry/caseSnapshot';
import { hydrateCasesWithSnapshot, scheduleBackgroundDbSync } from '@/lib/registry/dbSync';
import { getBlackNumberYear } from '@/lib/dashboard/metrics';

export interface GetCaseRegistryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  caseType?: string;
  status?: string;
  commissioner?: string;
  legalOfficer?: string;
  year?: string;
  nearDeadline?: boolean;
  overdue?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getCaseRegistry(params: GetCaseRegistryParams) {
  const {
    page = 1,
    pageSize = 10,
    searchTerm,
    caseType,
    status,
    commissioner,
    legalOfficer,
    year,
    nearDeadline,
    overdue,
    sortBy = 'receivedDate',
    sortOrder = 'desc',
  } = params;

  // 1. Attempt Database Query if configured
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (dbUrl && !dbUrl.includes('dummy') && !dbUrl.includes('[SENSITIVE]')) {
    try {
      const where: Prisma.CaseWhereInput = {};

      if (searchTerm) {
        where.OR = [
          { blackNumber: { contains: searchTerm, mode: 'insensitive' } },
          { redNumber: { contains: searchTerm, mode: 'insensitive' } },
          { petitionerName: { contains: searchTerm, mode: 'insensitive' } },
          { respondentName: { contains: searchTerm, mode: 'insensitive' } },
          { subject: { contains: searchTerm, mode: 'insensitive' } },
          { proceedingNote: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      if (caseType && caseType !== 'all') {
        where.type = caseType;
      }

      if (status && status !== 'all') {
        where.currentStatus = status;
      }

      if (commissioner && commissioner !== 'all') {
        where.OR = [
          { owner: { name: commissioner } },
          { committeeOwnerName: commissioner },
        ];
      }

      if (legalOfficer && legalOfficer !== 'all') {
        where.OR = [
          { legalOfficer: { name: legalOfficer } },
          { legalOfficerName: legalOfficer },
        ];
      }

      if (year && year !== 'all') {
        const buddhistYear = parseInt(year);
        const gregorianYear = buddhistYear - 543;
        where.receivedDate = {
          gte: new Date(`${gregorianYear}-01-01T00:00:00Z`),
          lt: new Date(`${gregorianYear + 1}-01-01T00:00:00Z`),
        };
      }

      const systemDate = new Date();
      const nearDeadlineDate = new Date();
      nearDeadlineDate.setDate(systemDate.getDate() + 7);

      if (nearDeadline || overdue) {
        const dateConditions: Prisma.DateTimeNullableFilter<'Case'>[] = [];

        if (nearDeadline) {
          dateConditions.push({ gte: systemDate, lte: nearDeadlineDate });
        }
        if (overdue) {
          dateConditions.push({ lt: systemDate });
        }

        const deadlineOr: Prisma.CaseWhereInput[] = [];

        dateConditions.forEach(cond => {
          deadlineOr.push(
            { dueDate30: cond },
            { dueDate60: cond },
            { dueDate90: cond },
            { dueDate120: cond },
            { dueDate240: cond }
          );
        });

        if (where.OR) {
          where.AND = [{ OR: deadlineOr }];
        } else {
          where.OR = deadlineOr;
        }
      }

      // Handle sorting
      let orderBy: Prisma.CaseOrderByWithRelationInput = { receivedDate: sortOrder };
      if (sortBy === 'dueDate30') orderBy = { dueDate30: sortOrder };
      else if (sortBy === 'status') orderBy = { currentStatus: sortOrder };
      else if (sortBy === 'commissioner') orderBy = { owner: { name: sortOrder } };
      else if (sortBy === 'blackNumber') orderBy = { blackNumber: sortOrder };

      const [totalCount, cases] = await prisma.$transaction([
        prisma.case.count({ where }),
        prisma.case.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            owner: true,
            legalOfficer: true,
          },
        }),
      ]);

      if (cases && cases.length > 0) {
        // Hydrate proceeding notes and other fields from snapshot
        hydrateCasesWithSnapshot(cases);
        scheduleBackgroundDbSync(prisma);

        return {
          data: cases as any,
          metadata: {
            total: totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        };
      }
    } catch (dbErr: any) {
      console.warn('[getCaseRegistry] Database error, falling back to snapshot:', dbErr?.message);
    }
  }

  // 2. Offline / Fallback Snapshot Implementation
  let snapCases = getHydratedSnapshotCases();

  if (caseType && caseType !== 'all') {
    snapCases = snapCases.filter(c => c.type === caseType);
  }

  if (status && status !== 'all') {
    snapCases = snapCases.filter(c => c.currentStatus === status);
  }

  if (commissioner && commissioner !== 'all') {
    snapCases = snapCases.filter(c => c.committeeOwnerName === commissioner);
  }

  if (legalOfficer && legalOfficer !== 'all') {
    const lo = legalOfficer.toLowerCase();
    snapCases = snapCases.filter(c => c.legalOfficerName?.toLowerCase().includes(lo));
  }

  if (year && year !== 'all') {
    snapCases = snapCases.filter(c => getBlackNumberYear(c.blackNumber).includes(year));
  }

  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    snapCases = snapCases.filter(c =>
      c.blackNumber?.toLowerCase().includes(q) ||
      c.redNumber?.toLowerCase().includes(q) ||
      c.petitionerName?.toLowerCase().includes(q) ||
      c.respondentName?.toLowerCase().includes(q) ||
      c.subject?.toLowerCase().includes(q) ||
      c.proceedingNote?.toLowerCase().includes(q) ||
      c.legalOfficerName?.toLowerCase().includes(q)
    );
  }

  // Sorting
  snapCases.sort((a, b) => {
    if (sortBy === 'blackNumber') {
      return sortOrder === 'asc'
        ? a.blackNumber.localeCompare(b.blackNumber, 'th', { numeric: true })
        : b.blackNumber.localeCompare(a.blackNumber, 'th', { numeric: true });
    }
    const dateA = a.receivedDate ? new Date(a.receivedDate).getTime() : 0;
    const dateB = b.receivedDate ? new Date(b.receivedDate).getTime() : 0;
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const total = snapCases.length;
  const start = (page - 1) * pageSize;
  const paged = snapCases.slice(start, start + pageSize).map(c => ({
    ...c,
    receivedDate: c.receivedDate ? new Date(c.receivedDate) : null,
    meetingDate: c.meetingDate ? new Date(c.meetingDate) : null,
    dueDate30: c.dueDate30 ? new Date(c.dueDate30) : null,
    dueDate60: c.dueDate60 ? new Date(c.dueDate60) : null,
    dueDate90: c.dueDate90 ? new Date(c.dueDate90) : null,
    dueDate120: c.dueDate120 ? new Date(c.dueDate120) : null,
    dueDate240: c.dueDate240 ? new Date(c.dueDate240) : null,
    owner: c.committeeOwnerName ? { name: c.committeeOwnerName } : null,
    legalOfficer: c.legalOfficerName ? { name: c.legalOfficerName } : null,
  }));

  return {
    data: paged as any,
    metadata: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

export async function getFilterOptions() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (dbUrl && !dbUrl.includes('dummy') && !dbUrl.includes('[SENSITIVE]')) {
    try {
      const [commissioners, legalOfficers] = await Promise.all([
        prisma.user.findMany({
          where: { role: 'commissioner' },
          select: { name: true },
          orderBy: { name: 'asc' }
        }),
        prisma.user.findMany({
          where: { role: 'legal_officer' },
          select: { name: true },
          orderBy: { name: 'asc' }
        })
      ]);

      if (commissioners.length > 0 || legalOfficers.length > 0) {
        return {
          commissioners: commissioners.map((c: { name: string }) => c.name),
          legalOfficers: legalOfficers.map((l: { name: string }) => l.name)
        };
      }
    } catch {}
  }

  // Fallback from snapshot
  const snapCases = getHydratedSnapshotCases();
  const comSet = new Set<string>();
  const legSet = new Set<string>();
  for (const c of snapCases) {
    if (c.committeeOwnerName && c.committeeOwnerName !== '-') comSet.add(c.committeeOwnerName);
    if (c.legalOfficerName && c.legalOfficerName !== '-') legSet.add(c.legalOfficerName);
  }

  return {
    commissioners: Array.from(comSet).sort(),
    legalOfficers: Array.from(legSet).sort(),
  };
}
