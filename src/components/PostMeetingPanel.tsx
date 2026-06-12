"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, AlertTriangle, FileText, CheckCircle, XCircle } from 'lucide-react';
import { POST_MEETING_FOLLOWUP_LABELS, PostMeetingFollowupStatus } from '@/lib/finalization/postMeetingFollowupStatus';

export function PostMeetingPanel({ caseId, finalizationData, canManage }: { caseId: string, finalizationData: any, canManage: boolean }) {
  const router = useRouter();
  const [redNumber, setRedNumber] = useState('');
  const [closureNote, setClosureNote] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!finalizationData) {
    return null;
  }

  const handleRecordRedNumber = async () => {
    if (!redNumber) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/finalization/red-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redNumber }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/finalization/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrideReason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to finalize');
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCase = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/finalization/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closureNote }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to close case');
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg border border-slate-200 mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-semibold leading-6 text-slate-900 mb-4 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-blue-600" />
          งานหลังประชุมและการจัดทำฉบับสุดท้าย
        </h3>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
            <span className="text-sm font-medium text-slate-500">สถานะ</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {POST_MEETING_FOLLOWUP_LABELS[finalizationData.status as PostMeetingFollowupStatus] || finalizationData.status}
            </span>
          </div>

          {finalizationData.revisionRequired && !finalizationData.revisionCompletedAt && (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">มติที่ประชุมให้แก้ไขร่าง</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    {finalizationData.revisionInstruction || "ไม่มีรายละเอียดเพิ่มเติม"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {canManage && finalizationData.status === PostMeetingFollowupStatus.READY_FOR_RED_NUMBER && (
            <div className="border border-slate-200 rounded-md p-4">
              <label htmlFor="redNumber" className="block text-sm font-medium text-slate-700 mb-2">บันทึกเลขแดง</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="redNumber"
                  value={redNumber}
                  onChange={(e) => setRedNumber(e.target.value)}
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="เช่น ร. 12/2567"
                  disabled={isSubmitting}
                />
                <button
                  onClick={handleRecordRedNumber}
                  disabled={isSubmitting || !redNumber}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  บันทึก
                </button>
              </div>
            </div>
          )}

          {canManage && finalizationData.status === PostMeetingFollowupStatus.RED_NUMBER_RECORDED && (
             <div className="border border-slate-200 rounded-md p-4 space-y-4">
                <h4 className="text-sm font-medium text-slate-900">ตรวจความพร้อมฉบับสมบูรณ์</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">เหตุผลยกเว้น (กรณีไม่ผ่านเงื่อนไขบางข้อ)</label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="เหตุผล (ถ้ามี)"
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  onClick={handleFinalize}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  ยืนยันความสมบูรณ์
                </button>
             </div>
          )}

          {canManage && finalizationData.status === PostMeetingFollowupStatus.FINALIZED && (
             <div className="border border-slate-200 rounded-md p-4 space-y-4 bg-slate-50">
                <h4 className="text-sm font-medium text-slate-900">การปิดสำนวน</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">บันทึกการปิดสำนวน (ตัวเลือก)</label>
                  <textarea
                    value={closureNote}
                    onChange={(e) => setClosureNote(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="เหตุผลหรือหมายเหตุการปิดสำนวน"
                    disabled={isSubmitting}
                    rows={2}
                  />
                </div>
                <button
                  onClick={handleCloseCase}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-50"
                >
                  ปิดสำนวน (Close Case)
                </button>
             </div>
          )}

          {canManage && finalizationData.status === PostMeetingFollowupStatus.CLOSED && (
             <div className="rounded-md bg-green-50 p-4 border border-green-200 flex items-center gap-3">
               <CheckCircle className="h-5 w-5 text-green-500" />
               <div className="text-sm font-medium text-green-800">สำนวนนี้ถูกปิดเรียบร้อยแล้ว</div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
