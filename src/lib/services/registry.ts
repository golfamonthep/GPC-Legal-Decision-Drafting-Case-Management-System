import prisma from '@/lib/db';
import { Prisma } from '@/generated/prisma';

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

  const where: Prisma.CaseWhereInput = {};

  if (searchTerm) {
    where.OR = [
      { blackNumber: { contains: searchTerm, mode: 'insensitive' } },
      { redNumber: { contains: searchTerm, mode: 'insensitive' } },
      { petitionerName: { contains: searchTerm, mode: 'insensitive' } },
      { respondentName: { contains: searchTerm, mode: 'insensitive' } },
      { subject: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  if (caseType && caseType !== 'all') {
    where.type = caseType;
  }

  if (status && status !== 'all') {
    where.currentStatus = status;
  }

  if (commissioner && commissioner !== 'all') {
    where.owner = { name: commissioner };
  }

  if (legalOfficer && legalOfficer !== 'all') {
    where.legalOfficer = { name: legalOfficer };
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

    // If there's already an OR (like from searchTerm), we need to use AND
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

  return {
    data: cases,
    metadata: {
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

export async function getFilterOptions() {
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

  return {
    commissioners: commissioners.map((c: { name: string }) => c.name),
    legalOfficers: legalOfficers.map((l: { name: string }) => l.name)
  };
}
