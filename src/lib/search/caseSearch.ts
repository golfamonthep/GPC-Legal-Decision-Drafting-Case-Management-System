import prisma from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { evaluateDataQuality } from "./dataQuality";

export interface SearchCaseParams {
  keyword?: string;
  
  // Case identifiers
  blackNumber?: string;
  redNumber?: string;
  
  // Parties
  petitionerName?: string;
  respondentName?: string;
  
  // Content
  subject?: string;
  
  // Workflow
  type?: string;
  status?: string;
  legalOfficerName?: string;
  ownerName?: string;
  
  // Safe preset filters
  preset?: string;

  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function searchCases(params: SearchCaseParams) {
  const {
    keyword,
    blackNumber,
    redNumber,
    petitionerName,
    respondentName,
    subject,
    type,
    status,
    legalOfficerName,
    ownerName,
    preset,
    page = 1,
    pageSize = 25,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = params;

  const where: Prisma.CaseWhereInput = {};
  const AND: Prisma.CaseWhereInput[] = [];

  // 1. Keyword Full-Text style search
  if (keyword) {
    const k = keyword.trim();
    AND.push({
      OR: [
        { blackNumber: { contains: k, mode: 'insensitive' } },
        { redNumber: { contains: k, mode: 'insensitive' } },
        { petitionerName: { contains: k, mode: 'insensitive' } },
        { respondentName: { contains: k, mode: 'insensitive' } },
        { subject: { contains: k, mode: 'insensitive' } },
        { currentStatus: { contains: k, mode: 'insensitive' } },
        { legalOfficerName: { contains: k, mode: 'insensitive' } },
        { proceedingNote: { contains: k, mode: 'insensitive' } },
        { decisionResult: { contains: k, mode: 'insensitive' } },
      ],
    });
  }

  // 2. Exact or partial field matches
  if (blackNumber) AND.push({ blackNumber: { contains: blackNumber.trim(), mode: 'insensitive' } });
  if (redNumber) AND.push({ redNumber: { contains: redNumber.trim(), mode: 'insensitive' } });
  if (petitionerName) AND.push({ petitionerName: { contains: petitionerName.trim(), mode: 'insensitive' } });
  if (respondentName) AND.push({ respondentName: { contains: respondentName.trim(), mode: 'insensitive' } });
  if (subject) AND.push({ subject: { contains: subject.trim(), mode: 'insensitive' } });
  if (type) AND.push({ type });
  if (status) AND.push({ currentStatus: status });
  if (legalOfficerName) AND.push({ legalOfficerName: { contains: legalOfficerName.trim(), mode: 'insensitive' } });
  
  // Owner (Commissioner)
  if (ownerName) {
    AND.push({
      owner: {
        name: { contains: ownerName.trim(), mode: 'insensitive' },
      },
    });
  }

  // 3. Saved presets logic
  if (preset) {
    switch (preset) {
      case 'unfinished':
        AND.push({
          currentStatus: { notIn: ['เสร็จสิ้น', 'แล้วเสร็จ', 'ยุติเรื่อง', 'จำหน่ายเรื่อง', 'ปิดเรื่อง', 'closed', 'completed'] }
        });
        break;
      case 'no_officer':
        AND.push({
          OR: [
            { legalOfficerId: null },
            { legalOfficerName: null }
          ]
        });
        break;
      case 'has_red_unfinished':
        AND.push({
          redNumber: { not: null, notIn: ['', '-'] },
          currentStatus: { notIn: ['เสร็จสิ้น', 'แล้วเสร็จ', 'ยุติเรื่อง', 'จำหน่ายเรื่อง', 'ปิดเรื่อง', 'closed', 'completed'] }
        });
        break;
      case 'completed_no_red':
        AND.push({
          currentStatus: { in: ['เสร็จสิ้น', 'แล้วเสร็จ', 'ยุติเรื่อง', 'จำหน่ายเรื่อง', 'ปิดเรื่อง', 'closed', 'completed'] },
          OR: [
            { redNumber: null },
            { redNumber: '' },
            { redNumber: '-' }
          ]
        });
        break;
      case 'has_draft':
        AND.push({
          drafts: { some: {} }
        });
        break;
      case 'no_documents':
        AND.push({
          documents: { none: {} }
        });
        break;
      // Note: overdue and near_due are harder to query directly if dueDate is dynamic, 
      // but we can approximate it or filter in-memory if needed.
    }
  }

  if (AND.length > 0) {
    where.AND = AND;
  }

  // Determine sorting
  const orderBy: Prisma.CaseOrderByWithRelationInput = {};
  if (sortBy === 'receivedDate') orderBy.receivedDate = sortOrder;
  else if (sortBy === 'blackNumber') orderBy.blackNumber = sortOrder;
  else if (sortBy === 'redNumber') orderBy.redNumber = sortOrder;
  else if (sortBy === 'currentStatus') orderBy.currentStatus = sortOrder;
  else orderBy.updatedAt = sortOrder;

  const take = Math.min(Math.max(pageSize, 10), 100);
  const skip = (Math.max(page, 1) - 1) * take;

  const [total, cases] = await Promise.all([
    prisma.case.count({ where }),
    prisma.case.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        owner: { select: { name: true } },
        legalOfficer: { select: { name: true } },
        _count: {
          select: { documents: true, drafts: true }
        }
      }
    })
  ]);

  // Apply derived flags
  const enhancedCases = cases.map((c: any) => {
    const flags = evaluateDataQuality(c);
    return {
      ...c,
      flags,
      documentCount: c._count.documents,
      draftCount: c._count.drafts,
    };
  });

  return {
    items: enhancedCases,
    total,
    page,
    pageSize: take,
    totalPages: Math.ceil(total / take),
  };
}
