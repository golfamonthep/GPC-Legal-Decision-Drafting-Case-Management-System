export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { DashboardCard } from "@/components/DashboardCard";
import { CaseTable } from "@/components/CaseTable";

import { FileText, AlertTriangle, Scale, Clock, Calendar, CheckSquare } from "lucide-react";
import { 
  getDashboardStats, 
  getOverdueCases, 
  getDueSoonCases, 
  getRecentCaseEvents 
} from "@/lib/services/dashboard";
import { Case } from "@/types";
import { isClosedOrRedCase } from "@/lib/caseStatus";
import { requirePermission } from "@/lib/auth/requirePermission";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";
import { detectCaseDataQualityIssues } from "@/lib/dataQuality/caseDataQuality";
import Link from "next/link";
import prisma from "@/lib/db";
import { Send } from "lucide-react";

function calculateDaysUntilDue(caseData: any): number | undefined {
  const now = new Date();
  const dueDate = caseData.dueDate30 || caseData.dueDate60 || caseData.dueDate90 || caseData.dueDate120 || caseData.dueDate240;
  if (!dueDate) return undefined;
  
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default async function DashboardPage() {
  await requirePermission("VIEW_DASHBOARD");
  const user = await getCurrentUser();
  const canViewDataQuality = user && hasPermission(user.role, 'VIEW_DATA_QUALITY');

  let stats = {
    totalCases: 0,
    grievanceCases: 0,
    appealCases: 0,
    draftCompletions: 0,
    overdueCount: 0,
    dueSoonCount: 0,
    postMeetingCount: 0,
    dispatchPending: 0,
  };

  let dqStats = { total: 0, critical: 0, high: 0, medium: 0 };

  let urgentCasesData: Case[] = [];
  let activitiesData: any[] = [];
  let upcomingMeetings: any[] = [];

  const canViewMeetings = user && hasPermission(user.role, 'VIEW_MEETINGS');

  try {
    const dbStats = await getDashboardStats();
    const dbOverdueCases = await getOverdueCases();
    const dbDueSoonCases = await getDueSoonCases(7);
    const dbRecentEvents = await getRecentCaseEvents();

    if (canViewMeetings) {
      upcomingMeetings = await prisma.meeting.findMany({
        where: { meetingDate: { gte: new Date() }, status: { not: 'CANCELLED' } },
        orderBy: { meetingDate: 'asc' },
        take: 3,
        include: { _count: { select: { agendaItems: true } } }
      });
    }

    const postMeetingCases = await prisma.case.count({
      where: {
        proceedingNote: {
          contains: '"_isFinalizationData":true'
        }
      }
    });

    const dispatchPendingCases = await prisma.case.count({
      where: {
        dispatchData: {
          not: null,
          contains: '"dispatchStatus":"NOT_STARTED"'
        }
      }
    });

    if (canViewDataQuality) {
      // Calculate data quality issues for dashboard
      const allCases = await prisma.case.findMany();
      for (const c of allCases) {
        const issues = detectCaseDataQualityIssues(c);
        dqStats.total += issues.length;
        dqStats.critical += issues.filter(i => i.severity === 'CRITICAL').length;
        dqStats.high += issues.filter(i => i.severity === 'HIGH').length;
        dqStats.medium += issues.filter(i => i.severity === 'MEDIUM').length;
      }
    }

    stats = {
      totalCases: dbStats.totalCases,
      grievanceCases: dbStats.grievanceCases,
      appealCases: dbStats.appealCases,
      draftCompletions: dbStats.draftCompletions,
      overdueCount: dbOverdueCases.length,
      dueSoonCount: dbDueSoonCases.length,
      postMeetingCount: postMeetingCases,
      dispatchPending: dispatchPendingCases,
    };

    // Combine and map Prisma cases to UI cases
    const dbUrgentCases = [...dbOverdueCases, ...dbDueSoonCases].map(c => {
      const daysUntilDue = calculateDaysUntilDue(c);
      let isOverdue = daysUntilDue !== undefined && daysUntilDue < 0;
      
      if (isClosedOrRedCase(c)) {
        isOverdue = false;
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
        ownerCommissioner: (c as any).owner?.name || "ไม่ระบุ",
        legalOfficer: (c as any).legalOfficer?.name || "ไม่ระบุ",
        receivedDate: c.receivedDate ? c.receivedDate.toISOString().split('T')[0] : "-",
        dueDates: { days30: "", days60: "", days90: "", days120: "", days240: "" }, // Placeholder as it's not strictly used in table
        currentStatus: c.currentStatus as any,
        isOverdue: isOverdue,
        daysUntilDue: daysUntilDue,
      };
    });
    
    // Deduplicate by ID just in case
    urgentCasesData = Array.from(new Map(dbUrgentCases.map(item => [item.id, item])).values());

    activitiesData = dbRecentEvents.map(e => ({
      id: e.id,
      caseId: e.case.blackNumber,
      action: e.action,
      actor: e.actorName,
      timestamp: e.timestamp.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }));
  } catch (error) {
    // Do not use mock data in production or pilot
    console.error("Failed to load dashboard data from database", error);
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-900">
            ภาพรวมระบบสนับสนุนการวินิจฉัย
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            สถิติและข้อมูลคดีที่อยู่ระหว่างดำเนินการของ ก.พ.ค.ตร.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="คดีทั้งหมด"
          value={stats.totalCases}
          icon={<Scale className="h-5 w-5" />}
          description={`ร้องทุกข์ ${stats.grievanceCases} คดี | อุทธรณ์ ${stats.appealCases} คดี`}
        />
        <DashboardCard
          title="คดีเกินกำหนดเวลา"
          value={stats.overdueCount}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          trend="down"
          trendValue="ต้องเร่งดำเนินการ"
          className={stats.overdueCount > 0 ? "border-red-200 bg-red-50" : ""}
        />
        <DashboardCard
          title="คดีใกล้ครบกำหนด (7 วัน)"
          value={stats.dueSoonCount}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          trend="neutral"
          trendValue="ความเสี่ยงสูง"
        />
        <DashboardCard
          title="ร่างคำวินิจฉัยแล้วเสร็จ"
          value={stats.draftCompletions}
          icon={<FileText className="h-5 w-5 text-green-500" />}
          description="ทั้งหมด"
        />
        {hasPermission(user?.role, 'VIEW_POST_MEETING_FOLLOWUP') && (
          <Link href="/finalization" className="block">
            <DashboardCard
              title="งานหลังประชุมที่ต้องติดตาม"
              value={stats.postMeetingCount}
              icon={<CheckSquare className="h-5 w-5 text-blue-500" />}
              description="กดเพื่อจัดการการจัดทำฉบับสุดท้าย"
              className="hover:border-blue-300 transition-colors cursor-pointer"
            />
          </Link>
        )}
        {hasPermission(user?.role, 'VIEW_DISPATCH_WORKFLOW') && (
          <Link href="/dispatch" className="block">
            <DashboardCard
              title="งานแจ้งผล/ศาลที่ต้องติดตาม"
              value={stats.dispatchPending}
              icon={<Send className="h-5 w-5 text-blue-500" />}
              description="จัดการการส่งหนังสือและศาล"
              className="hover:border-blue-300 transition-colors cursor-pointer"
            />
          </Link>
        )}
      </div>

      {canViewDataQuality && dqStats.total > 0 && (
        <div className="mt-8">
          <div className="bg-white shadow sm:rounded-lg border border-slate-200 p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium leading-6 text-slate-900 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                ปัญหาคุณภาพข้อมูลที่ควรตรวจสอบ
              </h3>
              <div className="mt-2 max-w-xl text-sm text-slate-500">
                <p>พบปัญหาที่ต้องตรวจสอบและแก้ไข: ระดับ Critical ({dqStats.critical}), High ({dqStats.high}), Medium ({dqStats.medium})</p>
              </div>
            </div>
            <div className="mt-3 sm:ml-4 sm:mt-0">
              <a
                href="/data-quality"
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                ดูและแก้ไขข้อมูล
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-lg font-semibold leading-6 text-slate-900">
              คดีที่ต้องเร่งดำเนินการ (เกินกำหนด / ใกล้ครบกำหนด)
            </h2>
          </div>
        </div>
        <div className="mt-4">
          <CaseTable cases={urgentCasesData} />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold leading-6 text-slate-900 mb-4">
          ความเคลื่อนไหวล่าสุด
        </h2>
        <div className="bg-white shadow sm:rounded-lg border border-slate-200">
          {activitiesData.length > 0 ? (
            <ul role="list" className="divide-y divide-slate-200">
              {activitiesData.map((activity) => (
                <li key={activity.id} className="p-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {activity.action}
                    </p>
                    <div className="ml-2 flex flex-shrink-0">
                      <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                        คดี: {activity.caseId}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-slate-500">
                        ผู้ดำเนินการ: {activity.actor}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                      <p>{activity.timestamp}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-sm text-slate-500">
              ยังไม่มีข้อมูลเพียงพอ
            </div>
          )}
        </div>
      </div>

      {canViewMeetings && upcomingMeetings.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold leading-6 text-slate-900">
              การประชุมคณะกรรมการที่กำลังจะมาถึง
            </h2>
            <Link href="/meetings" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-base font-semibold text-slate-900 truncate">
                    {meeting.title} ครั้งที่ {meeting.meetingNo}
                  </h3>
                  <div className="mt-2 text-sm text-slate-500 space-y-1">
                    <p className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> {meeting.meetingDate.toLocaleDateString('th-TH')}</p>
                    <p className="flex items-center"><Scale className="mr-2 h-4 w-4" /> {meeting._count.agendaItems} วาระ</p>
                  </div>
                  <div className="mt-4">
                    <Link href={`/meetings/${meeting.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      จัดการวาระประชุม &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
