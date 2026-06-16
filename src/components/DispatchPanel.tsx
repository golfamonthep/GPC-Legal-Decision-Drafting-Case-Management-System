"use client";

import { useState } from "react";
import { DispatchData } from "@/lib/dispatch/officialDispatchWorkflow";
import { OfficialDispatchStatus, OFFICIAL_DISPATCH_LABELS, CourtFollowupStatus, COURT_FOLLOWUP_LABELS } from "@/lib/dispatch/officialDispatchStatus";
import { CourtDeadlineInfo, getUrgencyLevelLabel } from "@/lib/dispatch/courtDeadline";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Send, MapPin, Scale, Clock, AlertTriangle, FileText } from "lucide-react";

interface DispatchPanelProps {
  caseId: string;
  dispatchData: DispatchData | null;
  deadlineInfo: CourtDeadlineInfo;
  permissions: {
    canManageDispatch: boolean;
    canRecordNotification: boolean;
    canRecordAcknowledgement: boolean;
    canRecordCourtFiling: boolean;
    canManageCourtFollowup: boolean;
  };
}

export function DispatchPanel({ caseId, dispatchData, deadlineInfo, permissions }: DispatchPanelProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  const handleInitialize = async () => {
    if (!confirm('ยืนยันเริ่มต้นกระบวนการแจ้งผลคำวินิจฉัย?')) return;
    setIsInitializing(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/dispatch`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
      setIsInitializing(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: th });
  };

  if (!dispatchData) {
    return (
      <div className="bg-white shadow sm:rounded-lg border border-slate-200">
        <div className="px-4 py-5 sm:p-6 text-center">
          <Send className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">ยังไม่ได้เริ่มกระบวนการแจ้งผลและติดตามศาล</h3>
          <p className="mt-1 text-sm text-slate-500 mb-4">
            กระบวนการนี้จะเริ่มหลังจากจัดทำคำวินิจฉัยฉบับสมบูรณ์แล้ว
          </p>
          {permissions.canManageDispatch && (
            <button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {isInitializing ? 'กำลังเริ่มต้น...' : 'เริ่มต้นกระบวนการแจ้งผล'}
            </button>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg border border-slate-200">
      <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold leading-6 text-slate-900 flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            การแจ้งผลและการติดตามศาล
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            สถานะแจ้งผล: <span className="font-semibold text-slate-700">{OFFICIAL_DISPATCH_LABELS[dispatchData.dispatchStatus]}</span> | 
            สถานะศาล: <span className="font-semibold text-slate-700 ml-1">{COURT_FOLLOWUP_LABELS[dispatchData.courtFollowupStatus]}</span>
          </p>
        </div>
      </div>
      
      <div className="px-4 py-5 sm:p-6 space-y-8">
        {/* Dispatch Section */}
        <div>
          <h4 className="text-base font-medium text-slate-900 flex items-center gap-2 border-b pb-2 mb-4">
            <MapPin className="h-4 w-4 text-slate-500" />
            ข้อมูลการแจ้งผล
          </h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">วันที่แจ้งผล</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(dispatchData.dispatchDate)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">วิธีแจ้งผล</dt>
              <dd className="mt-1 text-sm text-slate-900">{dispatchData.dispatchMethod || "-"}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">วันที่รับทราบ</dt>
              <dd className="mt-1 text-sm text-slate-900 font-semibold text-green-700">{formatDate(dispatchData.acknowledgementDate)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">วิธีรับทราบ</dt>
              <dd className="mt-1 text-sm text-slate-900">{dispatchData.acknowledgementMethod || "-"}</dd>
            </div>
            {dispatchData.dispatchNote && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-slate-500">บันทึกเพิ่มเติม</dt>
                <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{dispatchData.dispatchNote}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Court Section */}
        {dispatchData.courtFollowupStatus !== CourtFollowupStatus.NOT_APPLICABLE && dispatchData.acknowledgementDate && (
          <div>
            <h4 className="text-base font-medium text-slate-900 flex items-center gap-2 border-b pb-2 mb-4">
              <Scale className="h-4 w-4 text-slate-500" />
              การติดตามศาลปกครอง
            </h4>
            <div className="bg-slate-50 p-4 rounded-md mb-4 border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">วันครบกำหนดฟ้องคดี ({dispatchData.filingPeriodDays} วัน)</p>
                  <p className={`text-lg font-bold ${deadlineInfo.isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                    {deadlineInfo.filingDeadlineDate ? format(deadlineInfo.filingDeadlineDate, 'dd MMM yyyy', { locale: th }) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">ระดับความเสี่ยง</p>
                  <p className={`text-sm font-semibold px-2 py-1 inline-flex rounded-full ${
                    deadlineInfo.urgencyLevel === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                    deadlineInfo.urgencyLevel.includes('NEAR_DUE') ? 'bg-amber-100 text-amber-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {getUrgencyLevelLabel(deadlineInfo.urgencyLevel)}
                  </p>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">ศาล</dt>
                <dd className="mt-1 text-sm text-slate-900">{dispatchData.courtName || "-"}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">หมายเลขคดีศาล</dt>
                <dd className="mt-1 text-sm text-slate-900">{dispatchData.courtCaseNumber || "-"}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">วันที่ยื่นฟ้อง</dt>
                <dd className="mt-1 text-sm text-slate-900">{formatDate(dispatchData.courtFiledDate)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">ผลคำพิพากษา</dt>
                <dd className="mt-1 text-sm text-slate-900">{dispatchData.courtJudgmentCategory || "-"}</dd>
              </div>
            </dl>

            {dispatchData.courtEvents && dispatchData.courtEvents.length > 0 && (
              <div className="mt-6">
                <h5 className="text-sm font-medium text-slate-700 mb-2">ความเคลื่อนไหวทางคดีศาล</h5>
                <ul className="space-y-3">
                  {dispatchData.courtEvents.map(e => (
                    <li key={e.id} className="text-sm border-l-2 border-blue-200 pl-3">
                      <p className="font-semibold text-slate-800">{e.title} <span className="text-slate-500 font-normal ml-2">{formatDate(e.eventDate)}</span></p>
                      {e.description && <p className="text-slate-600 mt-1">{e.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 sm:px-6 flex justify-end gap-2 text-sm text-slate-500 italic">
        *การบันทึกแก้ไขข้อมูลเชิงลึกผ่านหน้าต่าง UI จะดำเนินการในสปรินต์ถัดไป
      </div>
    </div>
  );
}
