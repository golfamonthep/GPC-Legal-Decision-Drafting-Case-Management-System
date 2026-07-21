import { Case } from "../types";
import { StatusBadge } from "./StatusBadge";
import Link from "next/link";
import { AlertCircle, Clock, Eye, PencilLine } from "lucide-react";
import { cn } from "../lib/utils";
import { isClosedCaseStatus, hasRedCaseNumber } from "@/lib/caseStatus";

interface CaseTableProps {
  cases: Case[];
}

function formatUpdatedAt(value?: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString('th-TH', {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CaseTable({ cases }: CaseTableProps) {
  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-[1320px] w-full divide-y divide-slate-300">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">
              หมายเลขคดี
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
              ประเภท / เรื่อง
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
              คู่กรณี
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
              นิติกร
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
              การดำเนินการล่าสุด
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
              สถานะ
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
              กำหนดเวลา
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">จัดการ</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {cases.map((c) => {
            const updatedAtLabel = formatUpdatedAt(c.updatedAt);

            return (
              <tr key={c.id} className={cn(c.isOverdue && "bg-red-50/50")}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6 align-top">
                  <div>{c.blackNumber}</div>
                  {c.redNumber && <div className="text-red-600 text-xs mt-1">{c.redNumber}</div>}
                </td>
                <td className="px-3 py-4 text-sm text-slate-500 max-w-xs align-top">
                  <div className="font-medium text-slate-900">{c.type}</div>
                  <div className="line-clamp-2" title={c.subject}>{c.subject}</div>
                </td>
                <td className="px-3 py-4 text-sm text-slate-500 align-top max-w-[260px]">
                  <div>ผู้ร้อง: {c.petitionerName}</div>
                  <div className="text-xs mt-1">ผู้ถูกร้อง: {c.respondentName}</div>
                </td>
                <td className="px-3 py-4 text-sm text-slate-500 align-top min-w-[150px]">
                  <div className="font-medium text-slate-700 flex flex-col gap-1">
                    {c.legalOfficer && c.legalOfficer !== "-" && c.legalOfficer !== "ไม่ระบุ" ? (
                      <span className="text-slate-900">{c.legalOfficer}</span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 w-fit">ไม่มีนิติกร</span>
                    )}
                    {(!c.ownerCommissioner || c.ownerCommissioner === "-" || c.ownerCommissioner === "ไม่ระบุ") && (
                      <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/10 w-fit">ไม่มีกรรมการ</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 text-sm text-slate-600 align-top min-w-[300px] max-w-[380px]">
                  {c.proceedingNote ? (
                    <>
                      <div className="whitespace-pre-wrap break-words leading-6" title={c.proceedingNote}>
                        {c.proceedingNote}
                      </div>
                      {updatedAtLabel && (
                        <div className="mt-2 text-xs text-slate-400">อัปเดตล่าสุด: {updatedAtLabel}</div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      ยังไม่มีการบันทึกการดำเนินการ
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 align-top">
                  <StatusBadge status={c.currentStatus} />
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 align-top">
                  {isClosedCaseStatus(c.currentStatus) ? (
                    <div className="flex items-center text-green-600 font-medium">
                      เสร็จสิ้นแล้ว
                    </div>
                  ) : hasRedCaseNumber(c.redNumber) ? (
                    <div className="flex items-center text-green-600 font-medium">
                      เสร็จสิ้นตามเลขแดง
                    </div>
                  ) : c.isOverdue ? (
                    <div className="flex items-center text-red-600 font-medium">
                      <AlertCircle className="mr-1.5 h-4 w-4" />
                      เกินกำหนด {Math.abs(c.daysUntilDue || 0)} วัน
                    </div>
                  ) : (typeof c.daysUntilDue === 'number' && c.daysUntilDue <= 15) ? (
                    <div className="flex items-center text-amber-600 font-medium">
                      <Clock className="mr-1.5 h-4 w-4" />
                      เหลือ {c.daysUntilDue} วัน (ใกล้ครบกำหนด)
                    </div>
                  ) : typeof c.daysUntilDue === 'number' ? (
                    <div className="flex items-center text-slate-600">
                      <Clock className="mr-1.5 h-4 w-4" />
                      เหลือ {c.daysUntilDue} วัน
                    </div>
                  ) : (
                    <div className="text-slate-400">ไม่มีกำหนดเวลา</div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">รับเรื่อง: {c.receivedDate}</div>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 align-top">
                  <div className="flex flex-col items-end gap-2">
                    <Link href={`/cases/${c.id}/update`} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-500">
                      <PencilLine className="h-4 w-4" />
                      อัปเดต
                    </Link>
                    <Link href={`/cases/${c.id}`} className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                      รายละเอียด
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
