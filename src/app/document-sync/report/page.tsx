import React from 'react';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getMicrosoftGraphSyncRunSummary } from '@/lib/microsoft-graph/syncRunReports';

export const dynamic = 'force-dynamic';

export default async function DocumentSyncReportPage() {
  await requirePermission('VIEW_DOCUMENT_SYNC');

  const report = await getMicrosoftGraphSyncRunSummary();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">รายงานการทดสอบ Metadata Sync</h1>
        {report.productionSyncDisabled && (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full border border-gray-300">
            Production Sync Disabled
          </span>
        )}
      </div>

      {report.blockers.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
          <h3 className="text-sm font-medium text-red-800">สถานะถูกระงับ (Blocked)</h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {report.blockers.map((blocker, idx) => (
              <li key={idx}>{blocker}</li>
            ))}
          </ul>
        </div>
      )}

      {!report.ok && report.blockers.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-sm">
          <p className="text-sm text-yellow-800">Metadata persistence ยังไม่พร้อมใช้งานใน Staging</p>
        </div>
      )}

      {report.warnings.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-sm">
          <ul className="text-sm text-yellow-800 list-disc list-inside">
            {report.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">ประวัติการรัน</div>
          <div className="text-2xl font-bold">{report.summary.totalRuns}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">จำนวนรายการที่พบ</div>
          <div className="text-2xl font-bold">{report.summary.totalItemsSeen}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">จำนวน Metadata ที่บันทึก</div>
          <div className="text-2xl font-bold text-blue-600">{report.summary.totalItemsPersisted}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">จำนวนรายการที่ข้าม</div>
          <div className="text-2xl font-bold text-yellow-600">{report.summary.totalSkipped}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">ยังไม่มีการดาวน์โหลดเนื้อหาเอกสาร</div>
          <div className="text-xl font-semibold text-green-600">{report.contentDownloadedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">ยังไม่มีการสร้างเอกสารในระบบ</div>
          <div className="text-xl font-semibold text-green-600">{report.documentCreatedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">ยังไม่มีการนำเข้า RAG</div>
          <div className="text-xl font-semibold text-green-600">{report.ragIndexedCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-500">สำเร็จ</span>
          <span className="text-lg font-bold text-green-600">{report.summary.completedRuns}</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-500">ล้มเหลว</span>
          <span className="text-lg font-bold text-red-600">{report.summary.failedRuns}</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-500">สถานะล่าสุด</span>
          <span className="text-lg font-bold text-gray-700">{report.summary.lastStatus || '-'}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">ประวัติการรันล่าสุด</h2>
        </div>
        {report.recentRuns && report.recentRuns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันเวลา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">รายการที่พบ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">บันทึกแล้ว</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">การแจ้งเตือน</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.recentRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(run.startedAt).toLocaleString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${run.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          run.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{run.totalSeen}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{run.persistedItemCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{run.warningCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            ยังไม่มีประวัติการทดสอบ Metadata Sync
          </div>
        )}
      </div>
    </div>
  );
}
