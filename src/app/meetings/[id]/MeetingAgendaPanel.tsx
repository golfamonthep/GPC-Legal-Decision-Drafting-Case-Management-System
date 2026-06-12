"use client";

import { useState } from "react";
import { Plus, CheckCircle, AlertTriangle, Clock, Search, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function MeetingAgendaPanel({ meeting, canManage, canAddCase, canRecordResult }: any) {
  const router = useRouter();
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [searchBlackNo, setSearchBlackNo] = useState("");
  const [addingError, setAddingError] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  // In a real app, we'd have a debounced search API to find cases.
  // For this prototype, we'll assume we can search by black number or case ID directly via an endpoint.
  // To keep it simple, we'll just have an input for black number or case ID and submit it.

  const handleAddCase = async () => {
    setAddingError("");
    if (!searchBlackNo) return;
    
    try {
      // In a full implementation, we'd search for the case first.
      // Assuming the user pastes the UUID or we have an autocomplete that gives the UUID.
      // For now, we'll just send it. If it's a black number, the backend would need to resolve it.
      // But the API expects caseId. Let's pretend searchBlackNo is the caseId for the demo, 
      // or we just show an error if it fails.
      
      const res = await fetch(`/api/meetings/${meeting.id}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: searchBlackNo }), // Using input as caseId for demo
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }

      setIsAddingCase(false);
      setSearchBlackNo("");
      router.refresh();
    } catch (err: any) {
      setAddingError(err.message);
    }
  };

  return (
    <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-slate-200 flex justify-between items-center">
        <h3 className="text-base font-semibold leading-6 text-slate-900">
          วาระพิจารณา ({meeting.agendaItems?.length || 0} เรื่อง)
        </h3>
        {canAddCase && (
          <button
            onClick={() => setIsAddingCase(!isAddingCase)}
            className="inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
          >
            <Plus className="-ml-0.5 mr-1.5 h-4 w-4" />
            เพิ่มเรื่องเข้าวาระ
          </button>
        )}
      </div>

      {isAddingCase && (
        <div className="px-4 py-4 sm:px-6 border-b border-slate-200 bg-slate-50">
          <label className="block text-sm font-medium text-slate-700">ค้นหาสำนวนเพื่อเพิ่มเข้าวาระ (ระบุ Case ID หรือ เลขดำ)</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchBlackNo}
                onChange={(e) => setSearchBlackNo(e.target.value)}
                className="block w-full rounded-none rounded-l-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="กรอก Case ID (เพื่อการทดสอบ)"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCase}
              className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              เพิ่ม
            </button>
          </div>
          {addingError && <p className="mt-2 text-sm text-red-600">{addingError}</p>}
        </div>
      )}

      <ul role="list" className="divide-y divide-slate-200">
        {meeting.agendaItems?.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-slate-500">
            ยังไม่มีเรื่องในวาระการประชุม
          </li>
        ) : (
          meeting.agendaItems?.map((item: any) => (
            <li key={item.id} className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300">
                    {item.agendaNo}
                  </span>
                  <h4 className="text-base font-semibold leading-6 text-slate-900">
                    {item.case.subject} (เลขดำ: {item.case.blackNumber})
                  </h4>
                </div>
                <div className="flex gap-2">
                  <Link href={`/cases/${item.caseId}`} className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center">
                    ดูสำนวน <ExternalLink className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                <p>นิติกร: {item.case.legalOfficerName || 'ไม่ระบุ'}</p>
                <p>องค์คณะ: {item.case.committeeOwnerName || 'ไม่ระบุ'}</p>
                <p>สถานะปัจจุบัน: {item.case.currentStatus}</p>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-slate-900 mr-2">ความพร้อม:</span>
                  {item.readinessStatus === 'READY' ? (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      <CheckCircle className="mr-1 h-3 w-3" /> พร้อมเข้าวาระ
                    </span>
                  ) : item.readinessStatus === 'NEEDS_REVISION' ? (
                    <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                      <AlertTriangle className="mr-1 h-3 w-3" /> ต้องปรับแก้
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                      <Clock className="mr-1 h-3 w-3" /> รอตรวจความพร้อม
                    </span>
                  )}
                </div>
                {canRecordResult && (
                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                    บันทึกผลการพิจารณา
                  </button>
                )}
              </div>
              {item.boardResult && (
                <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm">
                  <span className="font-semibold text-blue-900">มติที่ประชุม: </span>
                  <span className="text-blue-800">{item.boardResult}</span>
                  {item.boardNote && <p className="mt-1 text-blue-700">{item.boardNote}</p>}
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
