import { CaseTable } from "@/components/CaseTable";
import prisma from "@/lib/db";
import { CaseStatus } from "@/types";
import { differenceInDays } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CasesPage() {
  const dbCases = await prisma.case.findMany({
    orderBy: { receivedDate: 'desc' },
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
      ownerCommissioner: c.ownerId || "-",
      legalOfficer: c.legalOfficerId || "-",
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
      isOverdue,
      daysUntilDue,
    };
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-900">
            รายการคดีทั้งหมด
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            รายการคดีร้องทุกข์และอุทธรณ์ที่อยู่ระหว่างดำเนินการ
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            สร้างเรื่องใหม่
          </button>
        </div>
      </div>

      <div className="mt-8">
        <CaseTable cases={formattedCases} />
      </div>
    </div>
  );
}

