'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Save } from 'lucide-react';

interface CaseStatusUpdateFormProps {
  caseId: string;
  currentStatus: string;
  currentProceedingNote?: string | null;
  canEdit: boolean;
}

const STANDARD_STATUSES = [
  'รับเรื่อง',
  'ตรวจสอบคำร้อง',
  'รอคำแก้',
  'แสวงหาข้อเท็จจริง',
  'รอเอกสาร/คำชี้แจง',
  'รอตรวจร่าง',
  'รอเข้าประชุม',
  'มีมติแล้ว',
  'แจ้งผลแล้ว',
  'เสร็จสิ้น',
  'เสร็จสิ้น (ศาลปกครอง)',
  'ยุติเรื่อง',
  'ปิดเรื่อง',
];

export function CaseStatusUpdateForm({
  caseId,
  currentStatus,
  currentProceedingNote,
  canEdit,
}: CaseStatusUpdateFormProps) {
  const router = useRouter();
  const statusOptions = useMemo(() => {
    return STANDARD_STATUSES.includes(currentStatus)
      ? STANDARD_STATUSES
      : [currentStatus, ...STANDARD_STATUSES];
  }, [currentStatus]);

  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState(currentProceedingNote ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || isSaving) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStatus: status,
          proceedingNote: note,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }

      setStatus(data.case.currentStatus);
      setNote(data.case.proceedingNote ?? '');
      setMessage({ type: 'success', text: data.message || 'บันทึกข้อมูลแล้ว' });
      router.refresh();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-white shadow sm:rounded-lg border border-slate-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-slate-900">อัปเดตสถานะและการดำเนินการ</h3>
        <p className="mt-1 text-sm text-slate-500">
          ข้อความในช่อง “การดำเนินการล่าสุด” จะแสดงในตาราง Dashboard เพื่อให้เห็นว่าแต่ละเรื่องดำเนินการถึงขั้นใดแล้ว
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="case-status" className="block text-sm font-medium text-slate-700">
              สถานะปัจจุบัน
            </label>
            <select
              id="case-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              disabled={!canEdit || isSaving}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="case-proceeding-note" className="block text-sm font-medium text-slate-700">
              การดำเนินการล่าสุด
            </label>
            <textarea
              id="case-proceeding-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={5}
              maxLength={10000}
              disabled={!canEdit || isSaving}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              placeholder="ตัวอย่าง: ส่งหนังสือขอคำชี้แจงแล้ว รอคำตอบภายในวันที่ ..."
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>ควรบันทึกผลล่าสุด งานที่รอ และขั้นตอนถัดไป</span>
              <span>{note.length.toLocaleString('th-TH')}/10,000</span>
            </div>
          </div>

          {message && (
            <div className={`rounded-md px-3 py-2 text-sm ${
              message.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-700'
                : 'border border-red-200 bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {message.text}
              </div>
            </div>
          )}

          {canEdit ? (
            <button
              type="submit"
              disabled={isSaving || !status.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการอัปเดต'}
            </button>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              บัญชีนี้ดูข้อมูลได้ แต่ไม่มีสิทธิ์แก้ไขสถานะคดี
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
