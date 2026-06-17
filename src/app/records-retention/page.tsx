import { requirePermission } from "@/lib/auth/requirePermission";
import { getRetentionOverview, getRetentionQueue } from "@/lib/records-retention/retentionQueries";
import { Archive, ShieldAlert, BookOpen, AlertCircle, Clock, Shield } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function RecordsRetentionPage() {
  // Server-side permission check
  await requirePermission("VIEW_RECORDS_ARCHIVE");

  // Fetch read-only data
  const overview = await getRetentionOverview();
  const queue = await getRetentionQueue();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 border-b border-slate-200 pb-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-3">
            <Archive className="h-8 w-8 text-indigo-600" />
            การเก็บรักษาและคลังสำนวน (Records Retention)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            ดูสถานะการเก็บรักษาสำนวนคดีและนโยบายการจัดเก็บ
          </p>
        </div>
      </div>

      {/* Safety Notice Panel */}
      <div className="rounded-md bg-blue-50 p-4 mb-8 border border-blue-200 shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <ShieldAlert className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">โหมดอ่านอย่างเดียว (Read-Only Mode)</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                หน้านี้เป็นการแสดงผลสถานะและประวัติการเก็บรักษาเท่านั้น ไม่มีการลบ ทำลาย หรือเปลี่ยนแปลงข้อมูลคดีในเวอร์ชันปัจจุบัน 
                การจัดการขั้นสูง (Archive/Purge) ต้องได้รับการอนุมัติและจะดำเนินการในขั้นตอนต่อไป
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-slate-100">
          <dt className="truncate text-sm font-medium text-slate-500 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-400" />
            คดีทั้งหมด (Total Cases)
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{overview.totalCases}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-slate-100">
          <dt className="truncate text-sm font-medium text-slate-500 flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
            พร้อมจัดเก็บ (Archive-Ready)
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{overview.archiveReady}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-slate-100">
          <dt className="truncate text-sm font-medium text-slate-500 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            รอการพิจารณา (Needs Review)
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{overview.requiresReview}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-slate-100">
          <dt className="truncate text-sm font-medium text-slate-500 flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-400" />
            อยู่ระหว่างดำเนินการ (Active)
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{overview.retainedActive}</dd>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Retention Queue Table */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg border border-slate-200">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
              <h3 className="text-base font-semibold leading-6 text-slate-900">คิวการจัดเก็บ (Retention Queue)</h3>
              <p className="mt-1 text-sm text-slate-500">
                รายการคดีและสถานะการจัดเก็บปัจจุบัน
              </p>
            </div>
            {queue.length > 0 ? (
              <ul role="list" className="divide-y divide-slate-100">
                {queue.map((caseItem) => (
                  <li key={caseItem.id} className="flex items-center justify-between gap-x-6 px-4 py-5 sm:px-6 hover:bg-slate-50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-start gap-x-3">
                        <p className="text-sm font-semibold leading-6 text-slate-900">{caseItem.blackNumber}</p>
                        <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          caseItem.lifecycleStatus === 'READY_TO_ARCHIVE' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                          caseItem.lifecycleStatus === 'RETENTION_REVIEW_REQUIRED' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                          'bg-blue-50 text-blue-700 ring-blue-600/20'
                        }`}>
                          {caseItem.lifecycleStatus}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-slate-500">
                        <p className="truncate">{caseItem.subject}</p>
                        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx="1" cy="1" r="1" /></svg>
                        <p className="whitespace-nowrap">สถานะ: {caseItem.currentStatus}</p>
                      </div>
                    </div>
                    <div className="flex flex-none items-center gap-x-4">
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        Archive Status: {caseItem.archiveStatus}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10">
                <Archive className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">ไม่มีรายการในคิว</h3>
                <p className="mt-1 text-sm text-slate-500">ยังไม่มีคดีที่เข้าเงื่อนไขการตรวจสอบหรือจัดเก็บ</p>
              </div>
            )}
          </div>
        </div>

        {/* Policy Reference Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg border border-slate-200">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
              <h3 className="text-base font-semibold leading-6 text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                นโยบายและวงจรชีวิตเอกสาร
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">การเข้าถึงและอนุญาต</h4>
                <p className="text-sm text-slate-600 mt-1">ผู้ที่สามารถแก้ไขนโยบายและทำการจัดเก็บต้องมีสิทธิ์ <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">MANAGE_RECORDS_ARCHIVE</code> และ <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">MANAGE_RETENTION_POLICY</code></p>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-semibold text-slate-900">การทำงานในเฟสปัจจุบัน</h4>
                <ul className="mt-2 list-disc list-inside text-sm text-slate-600 space-y-1">
                  <li>แสดงรายการและสถานะเบื้องต้น</li>
                  <li>ไม่มีการลบข้อมูลจริง</li>
                  <li>ข้อมูลถูกรักษาความปลอดภัยระดับ Database Access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
