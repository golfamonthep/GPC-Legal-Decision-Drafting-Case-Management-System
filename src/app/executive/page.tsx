import { requirePermission } from "@/lib/auth/requirePermission";
import { getExecutiveReportData, ReportFilterType } from "@/lib/reports/executiveReport";
import { DashboardCard } from "@/components/DashboardCard";
import { Scale, FileText, AlertTriangle, Clock, Download, CheckCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

export default async function ExecutiveDashboardPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const user = await requirePermission("VIEW_EXECUTIVE_DASHBOARD");
  const filterType = (searchParams.filter as ReportFilterType) || "all";

  const data = await getExecutiveReportData({ type: filterType });

  // Log view
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "EXECUTIVE_DASHBOARD_VIEWED",
      entityType: "REPORT",
      entityId: filterType,
      afterValue: "Success",
    }
  });

  // Generate Management Summary text deterministically
  const summary = {
    overview: `ภาพรวมระบบมีสำนวนทั้งหมด ${data.overview.totalCases} คดี, อยู่ระหว่างดำเนินการ ${data.overview.inProgress} คดี และเสร็จสิ้นแล้ว ${data.overview.completed} คดี`,
    risks: [] as string[],
    dataQuality: [] as string[],
  };

  if (data.overview.overdue > 10) summary.risks.push(`มีสำนวนเกินกำหนดจำนวนมาก (${data.overview.overdue} คดี)`);
  if (data.overview.unassignedLegalOfficer > 5) summary.risks.push(`มีสำนวนที่ยังไม่มีนิติกร ${data.overview.unassignedLegalOfficer} คดี`);
  if (data.dataQuality.nonStandardStatus > 0) summary.dataQuality.push(`พบสถานะไม่มาตรฐาน ${data.dataQuality.nonStandardStatus} คดี`);
  if (data.dataQuality.redNumberButNotCompleted > 0) summary.dataQuality.push(`มีเลขแดงแต่ยังไม่เสร็จสิ้น ${data.dataQuality.redNumberButNotCompleted} คดี`);
  if (data.securitySignals.permissionDenied > 10) summary.risks.push(`พบ Permission Denied บ่อยครั้ง (${data.securitySignals.permissionDenied} ครั้ง)`);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-6 text-slate-900">
            รายงานผู้บริหาร (Executive Dashboard)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            ภาพรวมสถานะสำนวน ความเสี่ยง และประสิทธิภาพการดำเนินงาน
          </p>
        </div>
        <div className="mt-4 flex gap-4 sm:ml-4 sm:mt-0">
          <select 
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
            defaultValue={filterType}
            onChange={(e) => { window.location.href='?filter=' + e.target.value; }}
          >
            <option value="all">ทั้งหมด</option>
            <option value="this_month">เดือนนี้</option>
            <option value="this_quarter">ไตรมาสนี้</option>
            <option value="this_fiscal_year">ปีงบประมาณนี้</option>
          </select>
          <form action="/api/reports/executive/export" method="GET" target="_blank">
            <input type="hidden" name="filter" value={filterType} />
            <button
              type="submit"
              className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <Download className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              ดาวน์โหลดสรุป CSV
            </button>
          </form>
        </div>
      </div>

      {/* Summary Alert */}
      <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">ข้อสังเกตสำหรับผู้บริหาร</h2>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li><strong>ภาพรวม:</strong> {summary.overview}</li>
          {summary.risks.length > 0 && (
            <li><strong>ความเสี่ยง:</strong> {summary.risks.join(', ')}</li>
          )}
          {summary.dataQuality.length > 0 && (
            <li><strong>คุณภาพข้อมูล:</strong> {summary.dataQuality.join(', ')}</li>
          )}
        </ul>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="สำนวนทั้งหมด" value={data.overview.totalCases} icon={<Scale className="h-5 w-5" />} />
        <DashboardCard title="อยู่ระหว่างดำเนินการ" value={data.overview.inProgress} icon={<Clock className="h-5 w-5 text-blue-500" />} />
        <DashboardCard title="เสร็จสิ้น" value={data.overview.completed} icon={<CheckCircle className="h-5 w-5 text-green-500" />} />
        <DashboardCard 
          title="เกินกำหนดเวลา" 
          value={data.overview.overdue} 
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />} 
          className={data.overview.overdue > 0 ? "border-red-200 bg-red-50" : ""}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Case Types & Statuses */}
        <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
          <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">ประเภทสำนวน และ สถานะ</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-2">ประเภท</h4>
              {Object.entries(data.caseTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{type}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-medium text-slate-500 mb-2">สถานะ (Top 5)</h4>
              {Object.entries(data.statuses)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm py-1">
                    <span className="text-slate-700">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deadline Risks */}
        <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
          <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">ความเสี่ยงด้านเวลา (Deadline Risk)</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-red-600 font-medium bg-red-50 p-2 rounded">
              <span>เกินกำหนดแล้ว</span>
              <span>{data.deadlineRisks.overdue}</span>
            </div>
            <div className="flex justify-between text-sm text-orange-600 font-medium bg-orange-50 p-2 rounded">
              <span>ครบกำหนดภายใน 30 วัน</span>
              <span>{data.deadlineRisks.d30}</span>
            </div>
            <div className="flex justify-between text-sm text-amber-600 p-2">
              <span>ครบกำหนดภายใน 60 วัน</span>
              <span>{data.deadlineRisks.d60}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-700 p-2">
              <span>ครบกำหนดภายใน 90 วัน</span>
              <span>{data.deadlineRisks.d90}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">* ไม่นับรวมสำนวนที่เสร็จสิ้นหรือออกเลขแดงแล้ว</p>
        </div>
      </div>

      {/* Workload */}
      <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
        <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">ภาระงานนิติกร (Top 10)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-300">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">นิติกร</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">รวม</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">ดำเนินการ</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-red-600">เกินกำหนด</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-green-600">เสร็จสิ้น</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.entries(data.workloadByLegalOfficer)
                .sort((a, b) => b[1].inProgress - a[1].inProgress)
                .slice(0, 10)
                .map(([name, wl]) => (
                  <tr key={name}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">{name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 text-right">{wl.total}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 text-right">{wl.inProgress}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-red-600 text-right">{wl.overdue > 0 ? wl.overdue : '-'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-green-600 text-right">{wl.completed}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quality & AI */}
        <div className="bg-white shadow rounded-lg border border-slate-200 p-6 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold leading-6 text-slate-900 text-amber-600 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" /> คุณภาพข้อมูล
              </h3>
              {hasPermission(user.role, 'VIEW_DATA_QUALITY') && (
                <Link href="/data-quality" className="text-sm text-blue-600 hover:text-blue-800 underline">
                  จัดการคุณภาพข้อมูล &rarr;
                </Link>
              )}
            </div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex justify-between"><span>ไม่มีเลขดำ</span> <span>{data.dataQuality.noBlackNumber}</span></li>
              <li className="flex justify-between"><span>ไม่มีเลขแดง</span> <span>{data.dataQuality.noRedNumber}</span></li>
              <li className="flex justify-between"><span>ไม่มีนิติกรรับผิดชอบ</span> <span>{data.dataQuality.noLegalOfficer}</span></li>
              <li className="flex justify-between"><span>มีเลขแดงแต่สถานะไม่เสร็จสิ้น</span> <span>{data.dataQuality.redNumberButNotCompleted}</span></li>
            </ul>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4 text-blue-600">การใช้งานระบบ</h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex justify-between"><span>AI Draft Generations</span> <span>{data.aiUsage.draftGenerations}</span></li>
              <li className="flex justify-between"><span>DOCX Exports</span> <span>{data.docxExport.total}</span></li>
              <li className="flex justify-between text-red-500"><span>Permission Denied Events</span> <span>{data.securitySignals.permissionDenied}</span></li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
