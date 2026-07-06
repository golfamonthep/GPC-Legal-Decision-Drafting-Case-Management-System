import React from 'react';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getMicrosoftGraphConfigStatus } from '@/lib/microsoft-graph/config';
import { listMockGraphDocuments } from '@/lib/microsoft-graph/mock';

export default async function DocumentSyncPage() {
  // Server-side permission guard
  await requirePermission('VIEW_DOCUMENT_SYNC');

  const status = getMicrosoftGraphConfigStatus();
  const preview = await listMockGraphDocuments();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">การเชื่อมต่อเอกสาร Microsoft 365</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              ข้อควรระวัง
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>ยังไม่เปิดการ Sync จริง โหมดทดสอบแบบ Mock เท่านั้น ไม่ดาวน์โหลดเอกสารจริงในขั้นตอนนี้</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">สถานะการตั้งค่า</h2>
          <ul className="space-y-3">
            <li className="flex justify-between items-center">
              <span className="text-gray-600">สถานะคอนฟิก (Configured):</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${status.configured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {status.configured ? 'ตั้งค่าแล้ว' : 'ยังไม่ตั้งค่า'}
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-600">การเปิดใช้งาน (Enabled):</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${status.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {status.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </span>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-gray-600">ข้อความระบบ:</span>
              <span className="text-sm text-gray-800 bg-gray-50 p-2 rounded border">{status.message}</span>
            </li>
            {status.missingKeys.length > 0 && (
              <li className="flex flex-col gap-1">
                <span className="text-gray-600 text-sm">Missing Configuration Keys:</span>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {status.missingKeys.map(key => <li key={key}>{key}</li>)}
                </ul>
              </li>
            )}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Future Sync Flow</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
            <li>กำหนดแหล่งเอกสารภายนอก (SharePoint/OneDrive)</li>
            <li>อ่าน Metadata เอกสารแบบ Dry-Run</li>
            <li>ตรวจสอบรายการเอกสารและแมปเข้ากับแฟ้มคดี (ถ้ามี)</li>
            <li>ผู้ใช้งานยืนยันคำสั่ง Sync</li>
            <li>นำเข้าข้อมูล Metadata และอัปเดตสถานะการเชื่อมต่อ</li>
          </ol>
          <div className="mt-6">
            <button 
              disabled 
              className="w-full py-2 px-4 bg-gray-300 text-gray-500 rounded cursor-not-allowed font-medium"
            >
              เริ่มการ Sync (Disabled)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">ตัวอย่างรายการเอกสาร (Mock Preview)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size (Bytes)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preview.foundItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.provider}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.size?.toLocaleString() ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {item.syncStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200 mt-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-red-800">รายการที่ถูกกักกัน (Quarantine Review)</h2>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow-sm mb-4">
          <div className="flex flex-col space-y-1">
            <p className="text-sm text-red-700 font-medium">ข้อกำหนดความปลอดภัย (Security Boundaries)</p>
            <ul className="list-disc list-inside text-sm text-red-600 ml-2">
              <li>ไม่ดาวน์โหลดเนื้อหาไฟล์ที่ถูกกักกัน</li>
              <li>ไม่ลบหรือแก้ไขไฟล์ใน Microsoft 365</li>
            </ul>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded border text-center">
            <p className="text-xs text-gray-500 mb-1">ทั้งหมด (Total)</p>
            <p className="text-xl font-bold text-gray-700">0</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded border text-center">
            <p className="text-xs text-yellow-600 mb-1">รอตรวจสอบ (Review Pending)</p>
            <p className="text-xl font-bold text-yellow-700">0</p>
          </div>
          <div className="bg-red-50 p-3 rounded border text-center">
            <p className="text-xs text-red-600 mb-1">ปฏิเสธ (Rejected)</p>
            <p className="text-xl font-bold text-red-700">0</p>
          </div>
          <div className="bg-blue-50 p-3 rounded border text-center">
            <p className="text-xs text-blue-600 mb-1">ส่งต่อให้ผู้ดูแลระบบ (Escalated)</p>
            <p className="text-xl font-bold text-blue-700">0</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เหตุผลที่ถูกกันไว้</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 italic">
                  ไม่มีรายการถูกกักกัน (Mock View Only)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-200 mt-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-purple-800">รายการเสนอสร้างเอกสารทางการ (Official Document Candidate)</h2>
        <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded shadow-sm mb-4">
          <div className="flex flex-col space-y-1">
            <p className="text-sm text-purple-700 font-medium">Official document integration: Design gate only</p>
            <ul className="list-disc list-inside text-sm text-purple-600 ml-2">
              <li>Not implemented</li>
              <li>Pending legal/reviewer approval</li>
              <li>No official Document creation</li>
              <li>No case linkage</li>
              <li>No RAG indexing</li>
              <li>No production</li>
            </ul>
          </div>
        </div>
        <div className="mt-4">
            <button 
              disabled 
              className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed font-medium text-sm"
            >
              อนุมัติสำหรับทดสอบใน Staging เท่านั้น (Disabled)
            </button>
        </div>
      </div>

    </div>
  );
}
