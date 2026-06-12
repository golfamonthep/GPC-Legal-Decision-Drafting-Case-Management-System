import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { hasPermission } from '@/lib/auth/permissions';
import prisma from '@/lib/db';
import { POST_MEETING_FOLLOWUP_LABELS, PostMeetingFollowupStatus } from '@/lib/finalization/postMeetingFollowupStatus';
import { parseFinalizationData } from '@/lib/finalization/caseFinalization';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, FileText, CheckSquare, Search } from 'lucide-react';
import { Case, User } from '@prisma/client';

export default async function FinalizationDashboard() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'VIEW_POST_MEETING_FOLLOWUP')) {
    redirect('/dashboard');
  }

  // Fetch cases with proceedingNote that has _isFinalizationData
  const cases = await prisma.case.findMany({
    where: {
      proceedingNote: {
        contains: '"_isFinalizationData":true'
      }
    },
    include: {
      legalOfficer: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  const finalizationCases = cases
    .map(c => {
      const parsed = parseFinalizationData(c.proceedingNote);
      return {
        caseRecord: c,
        finalizationData: parsed
      };
    })
    .filter((c): c is { caseRecord: Case & { legalOfficer: User | null }, finalizationData: any } => c.finalizationData !== null);

  const stats = {
    total: finalizationCases.length,
    revisionRequired: finalizationCases.filter(c => c.finalizationData.status === PostMeetingFollowupStatus.REVISION_REQUIRED).length,
    readyForRedNumber: finalizationCases.filter(c => c.finalizationData.status === PostMeetingFollowupStatus.READY_FOR_RED_NUMBER).length,
    readyToFinalize: finalizationCases.filter(c => c.finalizationData.status === PostMeetingFollowupStatus.RED_NUMBER_RECORDED || c.finalizationData.status === PostMeetingFollowupStatus.SIGNED).length,
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">งานหลังประชุมและการปิดสำนวน</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">งานทั้งหมด</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-red-100 dark:border-red-900/30">
          <h3 className="text-sm font-medium text-red-500 dark:text-red-400">รอแก้ร่าง</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.revisionRequired}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-yellow-100 dark:border-yellow-900/30">
          <h3 className="text-sm font-medium text-yellow-500 dark:text-yellow-400">รอออกเลขแดง</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.readyForRedNumber}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-green-100 dark:border-green-900/30">
          <h3 className="text-sm font-medium text-green-500 dark:text-green-400">พร้อมปิดสำนวน</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.readyToFinalize}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">เรื่องดำ / เรื่องแดง</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">เรื่อง</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">นิติกร</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">สถานะงานหลังประชุม</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">มติที่ประชุม</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {finalizationCases.map(({ caseRecord, finalizationData }: any) => (
                <tr key={caseRecord.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{caseRecord.blackNumber}</div>
                    {caseRecord.redNumber && (
                      <div className="text-sm text-red-600 dark:text-red-400">{caseRecord.redNumber}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">{caseRecord.subject}</div>
                    <div className="text-xs text-gray-500 mt-1">{caseRecord.petitionerName}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">{caseRecord.legalOfficer?.name || '-'}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {POST_MEETING_FOLLOWUP_LABELS[finalizationData.status as PostMeetingFollowupStatus] || finalizationData.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">{finalizationData.boardResultSummary || '-'}</div>
                  </td>
                  <td className="p-4">
                    <Link href={`/cases/${caseRecord.id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      เปิดดู
                    </Link>
                  </td>
                </tr>
              ))}
              {finalizationCases.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    ไม่มีรายการงานหลังประชุม
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
