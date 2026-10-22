import { CaseRegistryBlocks } from "@/components/CaseRegistryBlocks";
import { CaseListFilters } from "@/components/CaseListFilters";
import Link from "next/link";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth/requirePermission";
import { CaseStatus } from "@/types";
import { Prisma } from "@/generated/prisma";
import { filterCasesByRegistryCompletion, filterCasesByBlackYear, caseTextSearch } from "@/lib/caseList";
import { hasPermission } from "@/lib/auth/permissions";
import { getBlackNumberYear } from "@/lib/dashboard/metrics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CasesCacheItem {
  years: string[];
  cases: any[];
  timestamp: number;
}
const casesPageCache = new Map<string, CasesCacheItem>();
const CACHE_TTL_MS = 20_000;






export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requirePermission("VIEW_CASES");

  const params = await searchParams;
  const typeFilter = params.type as string;
  const completionStatusFilter = params.completionStatus as string;
  const redNumberStatusFilter = params.redNumberStatus as string;
  const qaMissingFieldsFilter = params.qaMissingFields as string;
  const legalOfficerFilter = params.legalOfficer as string;
  const unassignedFilter = params.unassigned as string;
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 200) : '';
  const year = typeof params.year === 'string' ? params.year : '';

  const where: Prisma.CaseWhereInput = {};

  if (typeFilter) {
    where.type = typeFilter;
  }

  if (legalOfficerFilter) {
    where.OR = [
      { legalOfficerName: { contains: legalOfficerFilter, mode: 'insensitive' } },
      { legalOfficer: { name: { contains: legalOfficerFilter, mode: 'insensitive' } } }
    ];
  }

  if (unassignedFilter === "LEGAL") {
    where.legalOfficerId = null;
    // We only check if legalOfficerName is also empty or missing
    where.AND = [
      { OR: [{ legalOfficerName: null }, { legalOfficerName: "" }, { legalOfficerName: "-" }] }
    ];
  } else if (unassignedFilter === "COMMITTEE") {
    where.ownerId = null;
    where.AND = [
      { OR: [{ committeeOwnerName: null }, { committeeOwnerName: "" }, { committeeOwnerName: "-" }] }
    ];
  }

  // Completion filters are applied below with the same exact raw-cell rule as the dashboard.

  if (qaMissingFieldsFilter === "missing") {
    if (where.OR) {
      const existingOr = where.OR;
      const existingAnd = Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND] : []);
      where.AND = [...existingAnd, { OR: existingOr as any }] as Prisma.CaseWhereInput[];
    }
    where.OR = [
      { petitionerName: "" },
      { petitionerName: "-" },
      { subject: "" },
      { subject: "-" },
      { currentStatus: "" },
      { currentStatus: "-" },
      { receivedDate: null },
      // legal officer is trickier in Prisma without complex AND/OR, we'll keep it simple
    ];
  }

  if (query) {
    const and = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
    where.AND = [...and, caseTextSearch(query)];
  }
  const cacheKey = JSON.stringify({
    typeFilter: typeFilter || '',
    completionStatusFilter: completionStatusFilter || '',
    redNumberStatusFilter: redNumberStatusFilter || '',
    qaMissingFieldsFilter: qaMissingFieldsFilter || '',
    legalOfficerFilter: legalOfficerFilter || '',
    unassignedFilter: unassignedFilter || '',
    query: query || '',
    year: year || ''
  });

  const now = Date.now();
  const cached = casesPageCache.get(cacheKey);

  let years: string[] = [];
  let formattedCases: any[] = [];

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    years = cached.years;
    formattedCases = cached.cases;
  } else {
    const dbCases = await prisma.case.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        type: true,
        blackNumber: true,
        redNumber: true,
        registryRedText: true,
        petitionerName: true,
        respondentName: true,
        subject: true,
        legalCategory: true,
        committeeOwnerName: true,
        legalOfficerName: true,
        receivedDate: true,
        dueDate30: true,
        dueDate60: true,
        dueDate90: true,
        dueDate120: true,
        dueDate240: true,
        currentStatus: true,
        meetingDate: true,
        decisionResult: true,
        oneDriveUrl: true,
        proceedingNote: true,
        owner: { select: { id: true, name: true } },
        legalOfficer: { select: { id: true, name: true } },
      }
    });

    years = [...new Set(dbCases.map(c => getBlackNumberYear(c.blackNumber).replace('พ.ศ. ', '')))].sort().reverse();
    formattedCases = filterCasesByBlackYear(filterCasesByRegistryCompletion(dbCases, completionStatusFilter, redNumberStatusFilter), year).map((c) => {
      return {
        id: c.id,
        type: c.type as any,
        blackNumber: c.blackNumber,
        redNumber: c.redNumber || undefined,
        registryRedText: c.registryRedText,
        petitionerName: c.petitionerName,
        respondentName: c.respondentName,
        subject: c.subject,
        legalCategory: c.legalCategory,
        ownerCommissioner: c.owner?.name || (c as any).committeeOwnerName || '-',
        legalOfficer: c.legalOfficerName || c.legalOfficer?.name || '-',
        receivedDate: c.receivedDate ? c.receivedDate.toISOString().split('T')[0] : '-',
        dueDates: {
          days30: c.dueDate30 ? c.dueDate30.toISOString() : '-',
          days60: c.dueDate60 ? c.dueDate60.toISOString() : '-',
          days90: c.dueDate90 ? c.dueDate90.toISOString() : '-',
          days120: c.dueDate120 ? c.dueDate120.toISOString() : '-',
          days240: c.dueDate240 ? c.dueDate240.toISOString() : '-',
        },
        currentStatus: c.currentStatus as CaseStatus,
        meetingDate: c.meetingDate?.toISOString(),
        decisionResult: c.decisionResult || undefined,
        oneDriveUrl: c.oneDriveUrl || undefined,
        proceedingNote: c.proceedingNote || undefined,
      };
    });

    if (casesPageCache.size > 50) casesPageCache.clear();
    casesPageCache.set(cacheKey, { years, cases: formattedCases, timestamp: now });
  }

  return (
    <div className="gpc-tabler min-w-0 py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="case-workspace-header">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-900 font-thai">
            รายการคดีทั้งหมด
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-thai">
            แยกทะเบียนร้องทุกข์และอุทธรณ์ พร้อมรายการตามตัวกรองที่เลือก
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex space-x-3">
          <Link
            href="/assignments"
            className="block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 font-thai"
          >
            ระบบมอบหมาย/ภาระงาน
          </Link>
          {hasPermission(user.role, 'IMPORT_REGISTRY') && <Link href="/cases/new" className="btn btn-primary">เพิ่มเรื่องใหม่</Link>}
        </div>
      </div>

      <div className="mt-6">
        <CaseListFilters years={years} />
      </div>

      <div className="mt-4">
        <CaseRegistryBlocks cases={formattedCases} canEdit={hasPermission(user.role, 'EDIT_CASE')} canCreate={hasPermission(user.role, 'IMPORT_REGISTRY')} />
      </div>
    </div>
  );
}
