export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { DashboardCard } from "@/components/DashboardCard";
import { CaseTable } from "@/components/CaseTable";
import { mockCases, mockActivities } from "@/data/mock-data";
import { FileText, AlertTriangle, Scale, Clock } from "lucide-react";
import { 
  getDashboardStats, 
  getOverdueCases, 
  getDueSoonCases, 
  getRecentCaseEvents 
} from "@/lib/services/dashboard";
import { Case } from "@/types";
import { isClosedOrRedCase } from "@/lib/caseStatus";

function calculateDaysUntilDue(caseData: any): number | undefined {
  const now = new Date();
  const dueDate = caseData.dueDate30 || caseData.dueDate60 || caseData.dueDate90 || caseData.dueDate120 || caseData.dueDate240;
  if (!dueDate) return undefined;
  
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default async function DashboardPage() {
  let stats = {
    totalCases: mockCases.length,
    grievanceCases: mockCases.filter(c => c.type === "ร้องทุกข์").length,
    appealCases: mockCases.filter(c => c.type === "อุทธรณ์").length,
    draftCompletions: 0,
    overdueCount: mockCases.filter(c => c.isOverdue && !isClosedOrRedCase(c)).length,
    dueSoonCount: mockCases.filter(c => !c.isOverdue && (c.daysUntilDue || 0) <= 7 && !isClosedOrRedCase(c)).length,
  };

  let urgentCasesData: Case[] = mockCases.filter(c => (c.isOverdue || (c.daysUntilDue || 0) <= 7) && !isClosedOrRedCase(c));
  let activitiesData = mockActivities.slice(0, 5);

  try {
    const dbStats = await getDashboardStats();
    const dbOverdueCases = await getOverdueCases();
    const dbDueSoonCases = await getDueSoonCases(7);
    const dbRecentEvents = await getRecentCaseEvents();

    stats = {
      totalCases: dbStats.totalCases,
      grievanceCases: dbStats.grievanceCases,
      appealCases: dbStats.appealCases,
      draftCompletions: dbStats.draftCompletions,
      overdueCount: dbOverdueCases.length,
      dueSoonCount: dbDueSoonCases.length,
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
    console.error("Failed to load dashboard data from database, falling back to mock data:", error);
    if (process.env.NODE_ENV === 'production') {
      return (
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
             <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
             <h2 className="text-lg font-bold mb-2">ข้อผิดพลาดฐานข้อมูล</h2>
             <p>ไม่สามารถเชื่อมต่อฐานข้อมูล Production ได้ กรุณาตรวจสอบ DATABASE_URL ใน Vercel Environment Variables</p>
          </div>
        </div>
      );
    }
    // Silent fallback to mock data defined above
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
      </div>

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
        </div>
      </div>
    </div>
  );
}
