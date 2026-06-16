export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { requirePermission } from "@/lib/auth/requirePermission";
import { DashboardCard } from "@/components/DashboardCard";
import { CaseTable } from "@/components/CaseTable";
import { Send, CheckCircle, MapPin, AlertTriangle, Scale, Clock, FileText } from "lucide-react";
import prisma from "@/lib/db";
import { parseDispatchData } from "@/lib/dispatch/officialDispatchWorkflow";
import { calculateFilingDeadline, getUrgencyLevelLabel } from "@/lib/dispatch/courtDeadline";
import { OfficialDispatchStatus, OFFICIAL_DISPATCH_LABELS, CourtFollowupStatus, COURT_FOLLOWUP_LABELS } from "@/lib/dispatch/officialDispatchStatus";

export default async function DispatchDashboardPage() {
  await requirePermission("VIEW_DISPATCH_WORKFLOW");

  // Fetch only cases that have dispatchData initialized
  const cases = await prisma.case.findMany({
    where: { dispatchData: { not: null } },
    include: {
      legalOfficer: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' }
  });

  const dispatchStats = {
    totalActive: 0,
    preparingNotice: 0,
    dispatched: 0,
    acknowledged: 0,
    returned: 0,
    filingPeriodActive: 0,
    nearDeadline: 0,
    overdue: 0,
    courtCases: 0,
    completed: 0,
  };

  const enrichedCases = cases.map(c => {
    const data = parseDispatchData(c.dispatchData);
    const deadlineInfo = calculateFilingDeadline(data?.acknowledgementDate, data?.filingPeriodDays, data?.courtFollowupStatus);
    
    if (data) {
      if (data.dispatchStatus !== OfficialDispatchStatus.COMPLETED && data.courtFollowupStatus !== CourtFollowupStatus.COURT_FOLLOWUP_COMPLETED) {
        dispatchStats.totalActive++;
      }
      if (data.dispatchStatus === OfficialDispatchStatus.PREPARING_NOTICE || data.dispatchStatus === OfficialDispatchStatus.NOTICE_READY) dispatchStats.preparingNotice++;
      if (data.dispatchStatus === OfficialDispatchStatus.DISPATCHED) dispatchStats.dispatched++;
      if (data.dispatchStatus === OfficialDispatchStatus.ACKNOWLEDGED && data.courtFollowupStatus === CourtFollowupStatus.WAITING_FOR_FILING_PERIOD) dispatchStats.acknowledged++;
      if (data.dispatchStatus === OfficialDispatchStatus.RETURNED_UNDELIVERED || data.dispatchStatus === OfficialDispatchStatus.RE_DISPATCH_REQUIRED) dispatchStats.returned++;
      if (data.courtFollowupStatus === CourtFollowupStatus.FILING_PERIOD_ACTIVE || data.courtFollowupStatus === CourtFollowupStatus.NO_COURT_CASE_REPORTED) dispatchStats.filingPeriodActive++;
      if (data.courtFollowupStatus === CourtFollowupStatus.COURT_CASE_IN_PROGRESS || data.courtFollowupStatus === CourtFollowupStatus.COURT_CASE_FILED || data.courtFollowupStatus === CourtFollowupStatus.COURT_JUDGMENT_RECEIVED) dispatchStats.courtCases++;
      if (data.courtFollowupStatus === CourtFollowupStatus.COURT_FOLLOWUP_COMPLETED) dispatchStats.completed++;
    }

    if (deadlineInfo.urgencyLevel === 'OVERDUE') dispatchStats.overdue++;
    if (deadlineInfo.urgencyLevel.includes('NEAR_DUE')) dispatchStats.nearDeadline++;

    return {
      id: c.id,
      blackNumber: c.blackNumber,
      redNumber: c.redNumber,
      type: c.type,
      petitionerName: c.petitionerName,
      subject: c.subject,
      legalOfficer: c.legalOfficer?.name || c.legalOfficerName || "-",
      dispatchStatusLabel: data ? OFFICIAL_DISPATCH_LABELS[data.dispatchStatus] : "-",
      courtStatusLabel: data ? COURT_FOLLOWUP_LABELS[data.courtFollowupStatus] : "-",
      deadlineUrgency: getUrgencyLevelLabel(deadlineInfo.urgencyLevel),
      isOverdue: deadlineInfo.isOverdue
    };
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-6 text-slate-900 flex items-center gap-3">
            <Send className="h-8 w-8 text-blue-600" />
            แจ้งผลและติดตามศาล (Dispatch & Court Follow-up)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            ติดตามสถานะการจัดส่งหนังสือแจ้งผลคำวินิจฉัย และระยะเวลาการฟ้องคดีต่อศาลปกครอง
          </p>
        </div>
        <div className="mt-4 flex gap-4 sm:ml-4 sm:mt-0">
          <form action="/api/dispatch/export" method="GET" target="_blank">
            <button
              type="submit"
              className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              ดาวน์โหลดรายงานแจ้งผล
            </button>
          </form>
          <form action="/api/court-followup/export" method="GET" target="_blank">
            <button
              type="submit"
              className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              ดาวน์โหลดรายงานคดีศาล
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="รอจัดทำหนังสือ/รอส่ง" value={dispatchStats.preparingNotice} icon={<FileText className="h-5 w-5 text-blue-500" />} />
        <DashboardCard title="ส่งแล้ว (รอรับทราบ)" value={dispatchStats.dispatched} icon={<Send className="h-5 w-5 text-amber-500" />} />
        <DashboardCard title="ส่งไม่สำเร็จ/ตีกลับ" value={dispatchStats.returned} icon={<AlertTriangle className="h-5 w-5 text-red-500" />} className={dispatchStats.returned > 0 ? "border-red-200 bg-red-50" : ""} />
        <DashboardCard title="รับทราบแล้ว (รอพ้นระยะเวลา)" value={dispatchStats.acknowledged + dispatchStats.filingPeriodActive} icon={<CheckCircle className="h-5 w-5 text-green-500" />} />
        
        <DashboardCard title="ใกล้ครบกำหนดฟ้องคดี" value={dispatchStats.nearDeadline} icon={<Clock className="h-5 w-5 text-orange-500" />} className={dispatchStats.nearDeadline > 0 ? "border-orange-200 bg-orange-50" : ""} />
        <DashboardCard title="เลยระยะเวลาฟ้องคดี" value={dispatchStats.overdue} icon={<AlertTriangle className="h-5 w-5 text-red-600" />} className={dispatchStats.overdue > 0 ? "border-red-200 bg-red-50" : ""} />
        <DashboardCard title="มีคดีศาลที่ต้องติดตาม" value={dispatchStats.courtCases} icon={<Scale className="h-5 w-5 text-purple-500" />} />
        <DashboardCard title="ติดตามเสร็จสิ้น" value={dispatchStats.completed} icon={<CheckCircle className="h-5 w-5 text-slate-500" />} />
      </div>

      <div className="mt-8 bg-white shadow rounded-lg border border-slate-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">รายการคดีที่อยู่ระหว่างกระบวนการ</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-300">
              <thead>
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">หมายเลขคดีดำ</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">หมายเลขคดีแดง</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">ผู้ร้อง/ผู้อุทธรณ์</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">สถานะแจ้งผล</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">สถานะติดตามศาล</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">วันฟ้องคดี (แจ้งเตือน)</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {enrichedCases.map((c) => (
                  <tr key={c.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">{c.blackNumber}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{c.redNumber || "-"}</td>
                    <td className="px-3 py-4 text-sm text-slate-500 max-w-[200px] truncate">{c.petitionerName}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {c.dispatchStatusLabel}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                      <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                        {c.courtStatusLabel}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                      <span className={`font-medium ${c.isOverdue ? 'text-red-600' : ''}`}>
                        {c.deadlineUrgency}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                      <a href={`/cases/${c.id}`} className="text-blue-600 hover:text-blue-900">
                        ดู/แก้ไข
                      </a>
                    </td>
                  </tr>
                ))}
                {enrichedCases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                      ยังไม่มีสำนวนในกระบวนการแจ้งผลและติดตามศาล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
