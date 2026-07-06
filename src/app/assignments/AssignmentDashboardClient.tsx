'use client';

import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, FileText, Download, UserPlus, CheckCircle2 } from 'lucide-react';
import { DashboardCard } from '@/components/DashboardCard';
// Use hardcoded thresholds instead of importing from server-side caseAssignment to avoid Prisma client in browser
const HIGH_ACTIVE_WORKLOAD_THRESHOLD = 20;
const HIGH_OVERDUE_THRESHOLD = 5;
import Link from 'next/link';

export default function AssignmentDashboardClient({ currentUser }: { currentUser: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/assignments');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลภาระงานได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-200 rounded"></div><div className="space-y-3"><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-slate-200 rounded col-span-2"></div><div className="h-2 bg-slate-200 rounded col-span-1"></div></div><div className="h-2 bg-slate-200 rounded"></div></div></div></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return null;

  const { workload } = data;

  return (
    <div className="space-y-8 font-thai">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="สำนวน Active ทั้งหมด"
          value={workload.totalActiveCases}
          icon={<FileText className="h-5 w-5 text-blue-500" />}
        />
        <DashboardCard
          title="สำนวนเกินกำหนด (Active)"
          value={workload.totalOverdueCases}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          className={workload.totalOverdueCases > 0 ? "border-red-200 bg-red-50" : ""}
        />
        <DashboardCard
          title="ยังไม่มีนิติกร (Active)"
          value={workload.unassignedLegalOfficerCases}
          icon={<UserPlus className="h-5 w-5 text-amber-500" />}
          className={workload.unassignedLegalOfficerCases > 0 ? "border-amber-200 bg-amber-50" : ""}
        />
        <DashboardCard
          title="ยังไม่มีกรรมการ (Active)"
          value={workload.unassignedCommitteeOwnerCases}
          icon={<Users className="h-5 w-5 text-purple-500" />}
        />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">ภาระงานรายบุคคล</h2>
        <a href="/api/assignments/export" className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
          <Download className="h-4 w-4 mr-2" />
          Export Excel (CSV)
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Legal Officers Table */}
        <div className="bg-white shadow sm:rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg leading-6 font-medium text-slate-900">นิติกร</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ชื่อ</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Active</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">เกินกำหนด</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">ไม่มีเลขแดง</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {workload.legalOfficers.map((lo: any) => (
                  <tr key={lo.userId} className={lo.activeCases >= HIGH_ACTIVE_WORKLOAD_THRESHOLD ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center">
                      {lo.name}
                      {lo.activeCases >= HIGH_ACTIVE_WORKLOAD_THRESHOLD && <span title="ภาระงานสูง"><AlertTriangle className="h-4 w-4 text-red-500 ml-2" /></span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-500 font-bold">{lo.activeCases}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${lo.overdueCases >= HIGH_OVERDUE_THRESHOLD ? 'text-red-600 font-bold' : 'text-slate-500'}`}>{lo.overdueCases}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-500">{lo.noRedNumber}</td>
                  </tr>
                ))}
                {workload.legalOfficers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">ไม่พบข้อมูลผู้รับผิดชอบ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Committee Owners Table */}
        <div className="bg-white shadow sm:rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg leading-6 font-medium text-slate-900">กรรมการเจ้าของสำนวน</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ชื่อ</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Active</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">เกินกำหนด</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">เสร็จสิ้น</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {workload.committeeOwners.map((co: any) => (
                  <tr key={co.userId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{co.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-500 font-bold">{co.activeCases}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-500">{co.overdueCases}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-500">{co.completedCases}</td>
                  </tr>
                ))}
                {workload.committeeOwners.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">ไม่พบข้อมูลผู้รับผิดชอบ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Suggested Assignments */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          ข้อเสนอเบื้องต้นในการกระจายงาน (ระบบแนะนำ)
        </h3>
        <p className="text-sm text-blue-800 mb-4">
          คำเตือน: ข้อเสนอการกระจายงานเป็นเพียงข้อมูลประกอบการพิจารณา ผู้มีอำนาจต้องยืนยันก่อนบันทึกจริง ไม่มีการตั้งค่าอัตโนมัติ
        </p>
        <div className="bg-white rounded-md p-4 shadow-sm text-sm text-slate-700">
          <ul className="list-disc pl-5 space-y-2">
            <li>มีสำนวนที่ยังไม่มีนิติกร <span className="font-bold text-red-600">{workload.unassignedLegalOfficerCases}</span> คดี <Link href="/cases?unassigned=LEGAL" className="text-blue-600 hover:underline">คลิกเพื่อดูและมอบหมาย</Link></li>
            <li>นิติกรที่มีภาระงาน Active ต่ำสุด: {workload.legalOfficers.slice(-3).reverse().map((lo: any) => `${lo.name} (${lo.activeCases})`).join(', ')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
