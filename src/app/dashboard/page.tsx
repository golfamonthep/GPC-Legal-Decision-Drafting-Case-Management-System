export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Scale,
} from 'lucide-react';
import { DashboardCard } from '@/components/DashboardCard';
import { CaseTable } from '@/components/CaseTable';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getRecentCaseEvents } from '@/lib/services/dashboard';
import { isClosedOrRedCase } from '@/lib/caseStatus';
import { Case } from '@/types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

type CaseType = 'ร้องทุกข์' | 'อุทธรณ์';

type SectionStats = {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  dueSoon: number;
};

type SectionData = {
  stats: SectionStats;
  urgentCases: Case[];
};

function getActiveDueDate(caseData: any): Date | null {
  const dates = [
    caseData.dueDate30,
    caseData.dueDate60,
    caseData.dueDate90,
    caseData.dueDate120,
    caseData.dueDate240,
  ].filter((value): value is Date => value instanceof Date && !Number.isNaN(value.getTime()));

  if (dates.length === 0) return null;

  // The registers contain milestone dates. For an operational overview, use
  // the latest available deadline so an earlier milestone does not make every
  // extended case look overdue.
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function getDaysUntilDue(caseData: any, now: Date): number | undefined {
  const dueDate = getActiveDueDate(caseData);
  if (!dueDate) return undefined;
  return Math.ceil((dueDate.getTime() - now.getTime()) / MS_PER_DAY);
}

function mapCaseToTable(caseData: any, now: Date): Case {
  const daysUntilDue = getDaysUntilDue(caseData, now);
  const closed = isClosedOrRedCase(caseData);

  return {
    id: caseData.id,
    type: caseData.type,
    blackNumber: caseData.blackNumber,
    redNumber: caseData.redNumber || undefined,
    petitionerName: caseData.petitionerName,
    respondentName: caseData.respondentName,
    subject: caseData.subject,
    legalCategory: caseData.legalCategory,
    ownerCommissioner: caseData.owner?.name || caseData.committeeOwnerName || 'ไม่ระบุ',
    legalOfficer: caseData.legalOfficer?.name || caseData.legalOfficerName || 'ไม่ระบุ',
    receivedDate: caseData.receivedDate
      ? caseData.receivedDate.toISOString().split('T')[0]
      : '-',
    dueDates: {
      days30: caseData.dueDate30?.toISOString() || '-',
      days60: caseData.dueDate60?.toISOString() || '-',
      days90: caseData.dueDate90?.toISOString() || '-',
      days120: caseData.dueDate120?.toISOString() || '-',
      days240: caseData.dueDate240?.toISOString() || '-',
    },
    currentStatus: caseData.currentStatus,
    meetingDate: caseData.meetingDate?.toISOString(),
    decisionResult: caseData.decisionResult || undefined,
    oneDriveUrl: caseData.oneDriveUrl || undefined,
    proceedingNote: caseData.proceedingNote || undefined,
    isOverdue: !closed && daysUntilDue !== undefined && daysUntilDue < 0,
    daysUntilDue,
  } as Case;
}

function buildSectionData(cases: any[], now: Date): SectionData {
  const activeCases = cases.filter((caseData) => !isClosedOrRedCase(caseData));
  const completedCases = cases.length - activeCases.length;

  const urgentRecords = activeCases
    .map((caseData) => ({
      caseData,
      daysUntilDue: getDaysUntilDue(caseData, now),
    }))
    .filter(({ daysUntilDue }) => daysUntilDue !== undefined && daysUntilDue <= 7)
    .sort((left, right) => (left.daysUntilDue ?? 999999) - (right.daysUntilDue ?? 999999));

  const overdue = urgentRecords.filter(({ daysUntilDue }) => (daysUntilDue ?? 0) < 0).length;
  const dueSoon = urgentRecords.filter(({ daysUntilDue }) => (daysUntilDue ?? -1) >= 0).length;

  return {
    stats: {
      total: cases.length,
      active: activeCases.length,
      completed: completedCases,
      overdue,
      dueSoon,
    },
    urgentCases: urgentRecords.map(({ caseData }) => mapCaseToTable(caseData, now)),
  };
}

function CaseTypeSection({
  type,
  data,
}: {
  type: CaseType;
  data: SectionData;
}) {
  const isGrievance = type === 'ร้องทุกข์';
  const uploadHref = isGrievance
    ? '/registry/import?type=grievance'
    : '/registry/import?type=appeal';
  const listHref = `/cases?type=${encodeURIComponent(type)}`;
  const borderClass = isGrievance ? 'border-blue-200' : 'border-violet-200';
  const headingClass = isGrievance ? 'text-blue-800' : 'text-violet-800';
  const iconClass = isGrievance ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700';
  const buttonClass = isGrievance
    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    : 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500';

  return (
    <section className={`rounded-2xl border ${borderClass} bg-white shadow-sm overflow-hidden`}>
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-3 ${iconClass}`}>
            {isGrievance ? <FileText className="h-6 w-6" /> : <Scale className="h-6 w-6" />}
          </div>
          <div>
            <h2 className={`text-xl font-bold ${headingClass}`}>เรื่อง{type}</h2>
            <p className="mt-1 text-sm text-slate-500">
              สถิติ รายการใกล้ครบกำหนด และงานที่ต้องเร่งดำเนินการเฉพาะประเภทนี้
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={listHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FolderOpen className="h-4 w-4" />
            ดูรายการ{type}
          </Link>
          <Link
            href={uploadHref}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonClass}`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            อัปโหลดทะเบียน{type}
          </Link>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <DashboardCard
            title={`ทั้งหมด`}
            value={data.stats.total}
            icon={isGrievance ? <FileText className="h-5 w-5" /> : <Scale className="h-5 w-5" />}
            description={`เรื่อง${type}`}
          />
          <DashboardCard
            title="อยู่ระหว่างดำเนินการ"
            value={data.stats.active}
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            description="ยังไม่เสร็จสิ้น"
          />
          <DashboardCard
            title="เสร็จสิ้น/มีเลขแดง"
            value={data.stats.completed}
            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
            description="ไม่นับเป็นคดีค้าง"
          />
          <DashboardCard
            title="เกินกำหนดเวลา"
            value={data.stats.overdue}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            trend={data.stats.overdue > 0 ? 'down' : 'neutral'}
            trendValue={data.stats.overdue > 0 ? 'ต้องเร่งดำเนินการ' : 'ไม่มีคดีเกินกำหนด'}
            className={data.stats.overdue > 0 ? 'border-red-200 bg-red-50' : ''}
          />
          <DashboardCard
            title="ใกล้ครบกำหนด 7 วัน"
            value={data.stats.dueSoon}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            description="ควรติดตามล่วงหน้า"
          />
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              เรื่อง{type}ที่ต้องเร่งดำเนินการ
            </h3>
            <span className="text-xs text-slate-500">เกินกำหนดหรือครบกำหนดภายใน 7 วัน</span>
          </div>
          {data.urgentCases.length > 0 ? (
            <CaseTable cases={data.urgentCases} />
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
              ยังไม่มีเรื่อง{type}ที่เกินกำหนดหรือใกล้ครบกำหนด
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  await requirePermission('VIEW_DASHBOARD');

  const now = new Date();
  let grievanceData: SectionData = {
    stats: { total: 0, active: 0, completed: 0, overdue: 0, dueSoon: 0 },
    urgentCases: [],
  };
  let appealData: SectionData = {
    stats: { total: 0, active: 0, completed: 0, overdue: 0, dueSoon: 0 },
    urgentCases: [],
  };
  let unknownTypeCount = 0;
  let activitiesData: Array<{
    id: string;
    caseId: string;
    type: string;
    action: string;
    actor: string;
    timestamp: string;
  }> = [];
  let loadError = false;

  try {
    const [allCases, recentEvents] = await Promise.all([
      prisma.case.findMany({
        include: { owner: true, legalOfficer: true },
        orderBy: { receivedDate: 'desc' },
      }),
      getRecentCaseEvents(),
    ]);

    const grievanceCases = allCases.filter((caseData) => caseData.type === 'ร้องทุกข์');
    const appealCases = allCases.filter((caseData) => caseData.type === 'อุทธรณ์');
    unknownTypeCount = allCases.length - grievanceCases.length - appealCases.length;

    grievanceData = buildSectionData(grievanceCases, now);
    appealData = buildSectionData(appealCases, now);

    activitiesData = recentEvents.map((event) => ({
      id: event.id,
      caseId: event.case.blackNumber,
      type: event.case.type,
      action: event.action,
      actor: event.actorName,
      timestamp: event.timestamp.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  } catch (error) {
    loadError = true;
    console.error('Failed to load separated dashboard data', error);
  }

  const totalCases = grievanceData.stats.total + appealData.stats.total + unknownTypeCount;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-slate-900">
            ภาพรวมเรื่องร้องทุกข์และอุทธรณ์
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            แยกการนำเสนอและการติดตามงานตามทะเบียนทั้งสองประเภทอย่างชัดเจน
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="text-xs font-medium text-slate-500">ข้อมูลในระบบทั้งหมด</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalCases.toLocaleString('th-TH')} เรื่อง</div>
        </div>
      </div>

      {loadError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ไม่สามารถโหลดข้อมูล Dashboard ได้ กรุณาลองใหม่อีกครั้งหรือตรวจสอบการเชื่อมต่อฐานข้อมูล
        </div>
      )}

      {unknownTypeCount > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          พบข้อมูลที่ยังไม่ได้ระบุประเภท {unknownTypeCount.toLocaleString('th-TH')} เรื่อง กรุณาตรวจสอบในเมนูตรวจคุณภาพข้อมูล
        </div>
      )}

      <div className="mt-8 space-y-8">
        <CaseTypeSection type="ร้องทุกข์" data={grievanceData} />
        <CaseTypeSection type="อุทธรณ์" data={appealData} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">ความเคลื่อนไหวล่าสุดของทั้งสองทะเบียน</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {activitiesData.length > 0 ? (
            <ul role="list" className="divide-y divide-slate-200">
              {activitiesData.map((activity) => (
                <li key={activity.id} className="p-4 sm:px-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">{activity.action}</p>
                      <p className="mt-1 text-sm text-slate-500">ผู้ดำเนินการ: {activity.actor}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        activity.type === 'อุทธรณ์'
                          ? 'bg-violet-100 text-violet-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.type || 'ไม่ระบุประเภท'} · {activity.caseId}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{activity.timestamp}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">ยังไม่มีความเคลื่อนไหวล่าสุด</div>
          )}
        </div>
      </section>
    </div>
  );
}
