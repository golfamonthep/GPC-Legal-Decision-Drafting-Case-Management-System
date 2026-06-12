import { Case } from "../types";
import { StatusBadge } from "./StatusBadge";
import Link from "next/link";
import { AlertCircle, Clock } from "lucide-react";
import { cn } from "../lib/utils";
import { isClosedCaseStatus, hasRedCaseNumber } from "@/lib/caseStatus";

interface CaseTableProps {
  cases: Case[];
}

export function CaseTable({ cases }: CaseTableProps) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-slate-300">
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
              นิติกร / การดำเนินการ
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
          {cases.map((c) => (
            <tr key={c.id} className={cn(c.isOverdue && "bg-red-50/50")}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                <div>{c.blackNumber}</div>
                {c.redNumber && <div className="text-red-600 text-xs mt-1">{c.redNumber}</div>}
              </td>
              <td className="px-3 py-4 text-sm text-slate-500 max-w-xs truncate">
                <div className="font-medium text-slate-900">{c.type}</div>
                <div className="truncate" title={c.subject}>{c.subject}</div>
              </td>
              <td className="px-3 py-4 text-sm text-slate-500">
                <div>ผู้ร้อง: {c.petitionerName}</div>
                <div className="text-xs mt-1">ผู้ถูกร้อง: {c.respondentName}</div>
              </td>
              <td className="px-3 py-4 text-sm text-slate-500 max-w-[200px]">
                <div className="font-medium text-slate-700 flex flex-col gap-1">
                  {c.legalOfficer && c.legalOfficer !== "-" ? (
                    <span className="text-slate-900">{c.legalOfficer}</span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 w-fit">ไม่มีนิติกร</span>
                  )}
                  {(!((c as any).ownerCommissioner) || (c as any).ownerCommissioner === "-") && (
                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/10 w-fit">ไม่มีกรรมการ</span>
                  )}
                </div>
                {(c as any).proceedingNote && (
                  <div className="text-xs mt-2 truncate text-slate-400" title={(c as any).proceedingNote}>
                    {(c as any).proceedingNote}
                  </div>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                <StatusBadge status={c.currentStatus} />
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
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
                ) : (
                  <div className="flex items-center text-slate-600">
                    <Clock className="mr-1.5 h-4 w-4" />
                    เหลือ {c.daysUntilDue} วัน
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-1">รับเรื่อง: {c.receivedDate}</div>
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <Link href={`/cases/${c.id}`} className="text-blue-600 hover:text-blue-900">
                  ดูรายละเอียด
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
