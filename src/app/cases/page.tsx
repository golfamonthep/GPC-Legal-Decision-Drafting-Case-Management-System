import { CaseTable } from "@/components/CaseTable";
import { CaseListFilters } from "@/components/CaseListFilters";
import Link from "next/link";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth/requirePermission";
import { CaseStatus } from "@/types";
import { differenceInDays } from "date-fns";
import { Prisma } from "@/generated/prisma";
import { isClosedCaseStatus, hasRedCaseNumber } from "@/lib/caseStatus";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requirePermission("VIEW_CASES");

  const params = await searchParams;
  const typeFilter = params.type as string;
  const completionStatusFilter = params.completionStatus as string;
  const redNumberStatusFilter = params.redNumberStatus as string;
  const qaMissingFieldsFilter = params.qaMissingFields as string;
  const legalOfficerFilter = params.legalOfficer as string;
  const unassignedFilter = params.unassigned as string;

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

  // Handle completion status using mapped logic
  if (completionStatusFilter === "completed") {
    // We can't strictly filter in Prisma because it's a string match, 
    // but we know common completed statuses.
    where.currentStatus = { in: ['เสร็จสิ้น', 'เสร็จสิ้น (ศาลปกครอง)', 'เสร็จสิ้น(ศาลปกครอง)', 'แล้วเสร็จ', 'ยุติเรื่อง', 'จำหน่ายเรื่อง', 'ปิดเรื่อง', 'closed', 'completed'] };
  } else if (completionStatusFilter === "open") {
    where.currentStatus = { notIn: ['เสร็จสิ้น', 'เสร็จสิ้น (ศาลปกครอง)', 'เสร็จสิ้น(ศาลปกครอง)', 'แล้วเสร็จ', 'ยุติเรื่อง', 'จำหน่ายเรื่อง', 'ปิดเรื่อง', 'closed', 'completed'] };
  }

  if (redNumberStatusFilter === "hasRed") {
    where.redNumber = { not: null, gt: "" };
    // This simple check might not perfectly match hasRedCaseNumber logic, but it's close enough for DB query. We can refine in memory if needed.
  } else if (redNumberStatusFilter === "noRed") {
    where.OR = [
      { redNumber: null },
      { redNumber: "" },
      { redNumber: "-" },
      { redNumber: "ยังไม่ออก" },
      { redNumber: "ไม่มี" }
    ];
  }

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

  const dbCases = await prisma.case.findMany({
    where,
    orderBy: { receivedDate: 'desc' },
    include: { legalOfficer: true, owner: true }
  });

  const formattedCases = dbCases.map((c) => {
    let daysUntilDue = undefined;
    let isOverdue = false;
    
    if (c.dueDate90) {
      daysUntilDue = differenceInDays(c.dueDate90, new Date());
      isOverdue = daysUntilDue < 0;
    }

    return {
      id: c.id,
      type: c.type as any,
      blackNumber: c.blackNumber,
      redNumber: c.redNumber || undefined,
      petitionerName: c.petitionerName,
      respondentName: c.respondentName,
      subject: c.subject,
      legalCategory: c.legalCategory,
      ownerCommissioner: c.owner?.name || (c as any).committeeOwnerName || "-",
      legalOfficer: c.legalOfficer?.name || c.legalOfficerName || "-",
      receivedDate: c.receivedDate ? c.receivedDate.toISOString().split("T")[0] : "-",
      dueDates: {
        days30: c.dueDate30 ? c.dueDate30.toISOString() : "-",
        days60: c.dueDate60 ? c.dueDate60.toISOString() : "-",
        days90: c.dueDate90 ? c.dueDate90.toISOString() : "-",
        days120: c.dueDate120 ? c.dueDate120.toISOString() : "-",
        days240: c.dueDate240 ? c.dueDate240.toISOString() : "-",
      },
      currentStatus: c.currentStatus as CaseStatus,
      meetingDate: c.meetingDate?.toISOString(),
      decisionResult: c.decisionResult || undefined,
      oneDriveUrl: c.oneDriveUrl || undefined,
      proceedingNote: c.proceedingNote || undefined,
      isOverdue,
      daysUntilDue,
    };
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-900 font-thai">
            รายการคดีทั้งหมด
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-thai">
            รายการคดีร้องทุกข์และอุทธรณ์ที่อยู่ระหว่างดำเนินการ
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex space-x-3">
          <Link
            href="/assignments"
            className="block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 font-thai"
          >
            ระบบมอบหมาย/ภาระงาน
          </Link>
          <button
            type="button"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 font-thai"
          >
            สร้างเรื่องใหม่
          </button>
        </div>
      </div>

      <div className="mt-6">
        <CaseListFilters />
      </div>

      <div className="mt-4">
        <CaseTable cases={formattedCases as any} />
      </div>
    </div>
  );
}
